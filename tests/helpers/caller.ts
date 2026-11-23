import { createCaller } from '@/server/api/root';

import { MOCK_USER_ID } from './mock-data';

import type { createTRPCContext } from '@/server/api/trpc';

import type { TestDb } from './db';

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 建立測試用的 tRPC caller
 *
 * @param role - 登入者在 identity 的角色，預設為 `admin`；傳 `null` 代表在 IAM 找不到該使用者
 */
export function createTestCaller(
  db: TestDb,
  userId = MOCK_USER_ID,
  role: null | string = 'admin',
) {
  const ctx = {
    db: db as unknown as Context['db'],
    getRole: () => Promise.resolve(role),
    headers: new Headers(),
    session: {
      session: {
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
        id: 'test-session-id',
        ipAddress: null,
        token: 'test-token',
        updatedAt: new Date(),
        userAgent: null,
        userId,
      },
      user: {
        createdAt: new Date(),
        email: 'test@example.com',
        emailVerified: true,
        id: userId,
        image: null,
        name: 'Test User',
        updatedAt: new Date(),
      },
    } as Context['session'],
  };

  return createCaller(ctx);
}
