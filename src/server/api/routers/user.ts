import { Result } from 'better-result';
import { TRPCError } from '@trpc/server';
import { type } from 'arktype';

import assert from 'assert';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { env } from '@/env';

/**
 * IAM 使用者列表的回傳資料
 */
const APIUser = type({
  banned: 'boolean',
  banReason: 'string | null',
  createdAt: 'string.date.parse',
  displayUsername: 'string | null',
  id: 'string',
  role: 'string',
  username: 'string',
});
type APIUser = typeof APIUser.infer;

/**
 * IAM 使用者列表的回傳結構，包含資料和分頁資訊
 */
const APIUserListResponse = type({
  data: APIUser.array(),
  meta: {
    currentCursor: 'number',
    currentPage: 'number',
    hasNextPage: 'boolean',
    hasPreviousPage: 'boolean',
    nextCursor: 'number | null',
    perPage: 'number',
    totalItems: 'number',
    totalPages: 'number',
  },
});
type APIUserListResponse = typeof APIUserListResponse.infer;

/**
 * IAM 回傳的 tRPC 回應封包
 */
const APIUserListResponseEnvelope = type({
  result: {
    data: {
      json: APIUserListResponse,
    },
  },
}).or({
  error: {
    code: 'number',
    data: {
      code: 'string',
      httpStatus: 'number',
      path: 'string',
    },
    message: 'string',
  },
}).array().atLeastLength(1);

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

const ListUsersInput = type({
  /** 從完整列表起算的偏移量，預設為 `0` */
  cursor: 'number.integer >= 0 = 0',
  /** 每頁筆數，範圍 1–100，預設為 `10` */
  limit: '1 <= number.integer <= 100 = 10',
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
    url.searchParams.set('input', JSON.stringify({ 0: { json: { cursor, limit: IAM_PAGE_SIZE } } }));

    const response = (await Result.tryPromise({
      catch: (e) => new TRPCError({
        cause: e,
        code: 'BAD_GATEWAY',
        message: '無法連線至 IAM 服務',
      }),
      try: () => fetch(url, {
        headers: {
          'x-api-key': env.BETTER_AUTH_IAM_API_KEY,
        },
        signal: AbortSignal.timeout(10_000),
      }),
    })).andThen((response) => {
      if (response.ok) return Result.ok(response);
      return Result.err(new TRPCError({
        cause: response,
        code: 'BAD_GATEWAY',
        message: `無法從 IAM 取得使用者列表（HTTP ${response.status}）`,
      }));
    }).unwrap();

    const page = (await Result.tryPromise({
      catch: (e) => new TRPCError({ cause: e, code: 'BAD_GATEWAY', message: '無法解析 IAM 回應資料' }),
      try: () => response.json(),
    })).andThen((json) => {
      const parsed = APIUserListResponseEnvelope(json);

      if (parsed instanceof type.errors) return Result.err(new TRPCError({
        cause: parsed,
        code: 'BAD_GATEWAY',
        message: `IAM 使用者列表格式錯誤`,
      }));

      const result = parsed[0];

      assert(result !== undefined, 'should never be undefined');

      if ('error' in result) return Result.err(new TRPCError({
        cause: result.error,
        code: 'BAD_GATEWAY',
        message: result.error.message,
      }));

      return Result.ok(result.result.data.json);
    }).unwrap();

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
  list: protectedProcedure
    .input(ListUsersInput)
    .query(async ({ input }) => {
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
      const currentPage = totalItems ? Math.floor(currentCursor / perPage) + 1 : 0;
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
