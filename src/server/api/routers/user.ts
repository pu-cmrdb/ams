import assert from 'node:assert';

import { Result } from 'better-result';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { env } from '@/env';
import { z } from '@/lib/zod';

/**
 * IAM 使用者列表的回傳資料
 */
const APIUser = z.object({
  banned: z.boolean(),
  banReason: z.string().nullable(),
  createdAt: z.iso.datetime().transform((v) => new Date(v)),
  displayUsername: z.string().nullable(),
  id: z.string(),
  role: z.string(),
  username: z.string(),
});
type APIUser = z.infer<typeof APIUser>;

/**
 * IAM 使用者列表的回傳結構，包含資料和分頁資訊
 */
const APIUserListResponse = z.object({
  data: z.array(APIUser),
  meta: z.object({
    currentCursor: z.number(),
    currentPage: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextCursor: z.number().nullable(),
    perPage: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
});

/**
 * IAM tRPC 成功封包
 */
const APIUserListSuccessEnvelope = z
  .array(
    z.object({
      result: z.object({ data: z.object({ json: APIUserListResponse }) }),
    }),
  )
  .min(1);

/**
 * IAM tRPC 錯誤封包
 */
const APIUserListErrorEnvelope = z
  .array(
    z.object({
      error: z.object({
        code: z.number(),
        data: z.object({
          code: z.string(),
          httpStatus: z.number(),
          path: z.string(),
        }),
        message: z.string(),
      }),
    }),
  )
  .min(1);

/**
 * 向 IAM 分頁取得使用者時，每頁請求的筆數上限
 */
const IAM_PAGE_SIZE = 100 as const;

/**
 * 完整使用者列表的快取存活時間，單位為毫秒
 */
const CACHE_EXPIRY = 300_000 as const;

/**
 * 快取的完整使用者列表與其到期時間
 */
let cachedUsers: APIUser[] | null = null;
let cacheExpiresAt = 0;

/**
 * 進行中的 `fetchAllUsers` 請求，用於避免快取失效時的重複請求
 */
let fetchInFlight: null | Promise<APIUser[]> = null;

const ListUsersInput = z.object({
  /** 從完整列表起算的偏移量，預設為 `0` */
  cursor: z.number().int().min(0).default(0),
  /** 每頁筆數，範圍 1–100，預設為 `10` */
  limit: z.number().int().min(1).max(100).default(10),
});

/**
 * 向 IAM 服務逐頁取得所有使用者
 *
 * @throws {TRPCError} 連線失敗、HTTP 錯誤或回應格式不符時拋出 `BAD_GATEWAY`
 */
async function fetchAllUsers(): Promise<APIUser[]> {
  const users: APIUser[] = [];
  let cursor: null | number = 0;

  while (cursor != null) {
    const url = new URL('/api/trpc/users.list', env.BETTER_AUTH_IAM_URL);
    url.searchParams.set('batch', '1');
    url.searchParams.set(
      'input',
      JSON.stringify({ 0: { json: { cursor, limit: IAM_PAGE_SIZE } } }),
    );

    const response = (
      await Result.tryPromise({
        catch: (e) =>
          new TRPCError({
            cause: e,
            code: 'BAD_GATEWAY',
            message: '無法連線至 IAM 服務',
          }),
        try: () =>
          fetch(url, {
            headers: {
              'x-api-key': env.BETTER_AUTH_IAM_API_KEY,
            },
            signal: AbortSignal.timeout(10_000),
          }),
      })
    )
      .andThen((response) => {
        if (response.ok) {
          return Result.ok(response);
        }
        return Result.err(
          new TRPCError({
            cause: response,
            code: 'BAD_GATEWAY',
            message: `無法從 IAM 取得使用者列表（HTTP ${response.status}）`,
          }),
        );
      })
      .unwrap();

    const page = (
      await Result.tryPromise({
        catch: (e) =>
          new TRPCError({
            cause: e,
            code: 'BAD_GATEWAY',
            message: '無法解析 IAM 回應資料',
          }),
        try: () => response.json(),
      })
    )
      .andThen((json) => {
        if (
          typeof json !== 'object'
          || !Array.isArray(json)
          || json.length === 0
        ) {
          return Result.err(
            new TRPCError({
              code: 'BAD_GATEWAY',
              message: 'IAM 使用者列表格式錯誤',
            }),
          );
        }

        if ('error' in json[0]) {
          const parsed = APIUserListErrorEnvelope.safeParse(json);
          if (!parsed.success) {
            return Result.err(
              new TRPCError({
                cause: parsed.error,
                code: 'BAD_GATEWAY',
                message: 'IAM 使用者列表格式錯誤',
              }),
            );
          }
          const result = parsed.data[0];
          assert(result !== undefined, 'should never be undefined');
          return Result.err(
            new TRPCError({
              cause: result.error,
              code: 'BAD_GATEWAY',
              message: result.error.message,
            }),
          );
        }

        const parsed = APIUserListSuccessEnvelope.safeParse(json);
        if (!parsed.success) {
          return Result.err(
            new TRPCError({
              cause: parsed.error,
              code: 'BAD_GATEWAY',
              message: 'IAM 使用者列表格式錯誤',
            }),
          );
        }
        const result = parsed.data[0];
        assert(result !== undefined, 'should never be undefined');
        return Result.ok(result.result.data.json);
      })
      .unwrap();

    users.push(...page.data);

    cursor = page.meta.hasNextPage ? page.meta.nextCursor : null;
  }

  return users;
}

export const userRouter = createTRPCRouter({
  /**
   * 回傳所有 IAM 使用者的分頁結果
   *
   * - `cursor` — 從完整列表起算的偏移量，預設為 `0`
   * - `limit`  — 每頁筆數，範圍 1–100，預設為 `10`
   *
   * @remarks 完整使用者列表每五分鐘從 IAM 取得一次並快取於伺服器端，
   * 在此期間的請求均直接從記憶體回應
   */
  list: protectedProcedure.input(ListUsersInput).query(async ({ input }) => {
    if (!cachedUsers || Date.now() > cacheExpiresAt) {
      fetchInFlight ??= fetchAllUsers().finally(() => {
        fetchInFlight = null;
      });
      cachedUsers = await fetchInFlight;
      cacheExpiresAt = Date.now() + CACHE_EXPIRY;
    }

    const { cursor: currentCursor, limit: perPage } = input;

    const data = cachedUsers.slice(currentCursor, currentCursor + perPage);

    const totalItems = cachedUsers.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = totalItems
      ? Math.floor(currentCursor / perPage) + 1
      : 0;
    const hasNextPage = currentCursor + perPage < totalItems;
    const hasPreviousPage = currentCursor > 0;
    const nextCursor = hasNextPage ? currentCursor + perPage : null;

    return {
      data: data,
      meta: {
        currentCursor,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        perPage,
        totalItems,
        totalPages,
      },
    };
  }),
});
