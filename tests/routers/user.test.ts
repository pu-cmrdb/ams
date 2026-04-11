import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { createTestCaller } from '../helpers/caller';
import { createTestDb } from '../helpers/db';

import type { TestDb } from '../helpers/db';

const MOCK_USERS = Array.from({ length: 5 }, (_, i) => ({
  banned: false,
  banReason: null,
  createdAt: new Date().toISOString(),
  displayUsername: `使用者 ${i + 1}`,
  id: `user-${i + 1}`,
  role: 'member',
  username: `user${i + 1}`,
}));

function makeFetchMock(users = MOCK_USERS) {
  return (_: Request | string | URL, __?: RequestInit): Promise<Response> => {
    const body = [
      {
        result: {
          data: {
            json: {
              data: users,
              meta: {
                currentCursor: 0,
                currentPage: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                nextCursor: null,
                perPage: 100,
                totalItems: users.length,
                totalPages: 1,
              },
            },
          },
        },
      },
    ];

    return Promise.resolve(
      new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );
  };
}

describe('user router', () => {
  let db: TestDb;
  let caller: ReturnType<typeof createTestCaller>;
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    const result = createTestDb();
    db = result.db;
    caller = createTestCaller(db);
    globalThis.fetch = makeFetchMock() as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('list', () => {
    it('returns a paginated list of users', async () => {
      const { data, meta } = await caller.user.list({ cursor: 0, limit: 10 });

      expect(data).toHaveLength(5);
      expect(meta.totalItems).toBe(5);
      expect(meta.currentPage).toBe(1);
    });

    it('paginates with cursor and limit', async () => {
      const { data, meta } = await caller.user.list({ cursor: 0, limit: 2 });

      expect(data).toHaveLength(2);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.nextCursor).toBe(2);
    });

    it('returns the second page via cursor', async () => {
      const { data, meta } = await caller.user.list({ cursor: 2, limit: 2 });

      expect(data).toHaveLength(2);
      expect(meta.hasPreviousPage).toBe(true);
      expect(data[0]?.id).toBe('user-3');
    });

    it('returns the last partial page', async () => {
      const { data, meta } = await caller.user.list({ cursor: 4, limit: 10 });

      expect(data).toHaveLength(1);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.nextCursor).toBeNull();
    });

    it('includes user fields in the response', async () => {
      const { data } = await caller.user.list({ cursor: 0, limit: 1 });
      const [user] = data;

      expect(user?.id).toBeTruthy();
      expect(user?.username).toBeTruthy();
      expect(user?.role).toBe('member');
      expect(user?.banned).toBe(false);
    });
  });
});
