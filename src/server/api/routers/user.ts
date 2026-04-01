import { TRPCError } from '@trpc/server';
import { type } from 'arktype';

import { env } from '@/env';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

type IamUser = {
  id: string;
  imageHash: string;
  name: string;
};

type IamListMeta = {
  currentPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: number | null;
  totalItems?: number;
  totalPages?: number;
};

type IamUsersListResponse = {
  data: IamUser[];
  meta: IamListMeta;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const usersListCache = new Map<string, {
  expiresAt: number;
  value: IamUsersListResponse;
}>();

const ListUsersInput = type({
  /** offset，預設 0 */
  'cursor?': 'number.integer >= 0',
  /** 每頁筆數，0-100，預設 10 */
  'limit?': 'number.integer >= 0 <= 100',
});

function buildCacheKey(input: { cursor: number; limit: number }) {
  return `${input.cursor}:${input.limit}`;
}

function getCachedUsersList(key: string) {
  const cached = usersListCache.get(key);

  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    usersListCache.delete(key);
    return null;
  }

  return cached.value;
}


function setCachedUsersList(key: string, value: IamUsersListResponse) {
  usersListCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function parseUsersListResponse(payload: unknown): IamUsersListResponse {
  if (!payload || typeof payload !== 'object') {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: 'IAM users.list 回傳格式錯誤。',
    });
  }

  const direct = payload as Partial<IamUsersListResponse>;
  const wrapped = payload as {
    result?: {
      data?: {
        json?: IamUsersListResponse;
      };
    };
  };

  const candidate = wrapped.result?.data?.json ?? direct;

  if (!Array.isArray(candidate.data) || !candidate.meta || typeof candidate.meta !== 'object') {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: 'IAM users.list 缺少 data 或 meta。',
    });
  }

  return {
    data: candidate.data.map((item) => ({
      id: String(item.id ?? ''),
      imageHash: String(item.imageHash ?? ''),
      name: String(item.name ?? ''),
    })),
    meta: {
      currentPage: typeof candidate.meta.currentPage === 'number' ? candidate.meta.currentPage : undefined,
      hasNextPage: typeof candidate.meta.hasNextPage === 'boolean' ? candidate.meta.hasNextPage : undefined,
      hasPreviousPage: typeof candidate.meta.hasPreviousPage === 'boolean' ? candidate.meta.hasPreviousPage : undefined,
      nextCursor: typeof candidate.meta.nextCursor === 'number' || candidate.meta.nextCursor === null
        ? candidate.meta.nextCursor
        : undefined,
      totalItems: typeof candidate.meta.totalItems === 'number' ? candidate.meta.totalItems : undefined,
      totalPages: typeof candidate.meta.totalPages === 'number' ? candidate.meta.totalPages : undefined,
    },
  };
}

export const userRouter = createTRPCRouter({
  list: protectedProcedure
    .input(ListUsersInput)
    .query(async ({ input }) => {
      const cursor = input.cursor ?? 0;
      const limit = input.limit ?? 10;
      const normalizedInput = { cursor, limit };

      const cacheKey = buildCacheKey(normalizedInput);
      const cached = getCachedUsersList(cacheKey);
      if (cached) return cached;

      const url = new URL(`${env.BETTER_AUTH_IAM_URL}/api/trpc/users.list`);
      url.searchParams.set('input', JSON.stringify(normalizedInput));

      const response = await fetch(url, {
        headers: {
          'x-api-key': env.BETTER_AUTH_IAM_API_KEY,
        },
      });

      if (!response.ok) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: `IAM users.list 呼叫失敗（HTTP ${response.status}）。`,
        });
      }

      const payload = await response.json();
      const parsed = parseUsersListResponse(payload);

      setCachedUsersList(cacheKey, parsed);

      return parsed;
    }),
});
