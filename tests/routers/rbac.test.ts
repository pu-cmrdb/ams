import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { AssetStatus } from '@/lib/enums';
import { hasRole, resolveIamRole } from '@/server/auth/role';
import { resetIamUsersCache } from '@/server/iam/users';

import { BASE_ASSET, PLAN_DATES } from '../helpers/mock-data';
import { createTestCaller } from '../helpers/caller';
import { createTestDb } from '../helpers/db';

import type { TestDb, TestSqlite } from '../helpers/db';

/**
 * 只有 identity `admin` 能新增、修改、刪除財產、類別、盤點計畫，以及查看使用者名單
 */
describe('admin RBAC', () => {
  let db: TestDb;
  let client: TestSqlite;
  let admin: ReturnType<typeof createTestCaller>;
  let categoryId: string;
  let assetId: string;
  let planId: string;

  beforeEach(async () => {
    ({ client, db } = createTestDb());
    admin = createTestCaller(db);

    ({
      result: { id: categoryId },
    } = await admin.category.create({ name: '測試類別' }));
    ({ id: assetId } = await admin.asset.create({ ...BASE_ASSET, categoryId }));
    ({ id: planId } = await admin.inventory.create({
      ...PLAN_DATES,
      assetIds: [assetId],
      assigneeIds: ['test-user-id'],
      description: '盤點',
      name: '第一季盤點',
    }));
  });

  afterEach(() => {
    client.close(false);
  });

  for (const [label, role] of [
    ['一般 user', 'user'],
    ['在 IAM 找不到的使用者', null],
  ] as const) {
    describe(label, () => {
      const forbidden = (fn: () => Promise<unknown>) =>
        expect(fn()).rejects.toMatchObject({ code: 'FORBIDDEN' });

      it('不能新增、修改、刪除財產（資料不變）', async () => {
        const user = createTestCaller(db, 'member-id', role);

        await forbidden(() => user.asset.create({ ...BASE_ASSET, categoryId }));
        await forbidden(() => user.asset.update({ id: assetId, name: '被改掉' }));
        await forbidden(() =>
          user.asset.updateRecord({
            id: assetId,
            records: [{ quantity: 99, status: AssetStatus.Lost }],
          }),
        );
        await forbidden(() => user.asset.delete({ id: assetId }));

        const asset = await admin.asset.get({ id: assetId });
        expect(asset.name).toBe(BASE_ASSET.name);
        expect(asset.records).toHaveLength(0);
        expect(await admin.asset.list({})).toHaveLength(1);
      });

      it('不能新增、修改、刪除類別（資料不變）', async () => {
        const user = createTestCaller(db, 'member-id', role);

        await forbidden(() => user.category.create({ name: '新類別' }));
        await forbidden(() => user.category.update({ id: categoryId, name: '被改掉' }));
        await forbidden(() => user.category.delete({ id: categoryId }));

        const categories = await admin.category.list({});
        expect(categories.map((v) => v.name)).toEqual(['測試類別']);
      });

      it('不能新增、修改盤點計畫（資料不變）', async () => {
        const user = createTestCaller(db, 'member-id', role);

        await forbidden(() =>
          user.inventory.create({
            ...PLAN_DATES,
            assetIds: [],
            assigneeIds: [],
            description: '偷建',
            name: '偷建的計畫',
          }),
        );
        await forbidden(() =>
          user.inventory.update({ id: planId, name: '被改掉', status: 'completed' }),
        );

        const plan = await admin.inventory.get({ id: planId });
        expect(plan?.name).toBe('第一季盤點');
        expect(plan?.status).toBe('pending');
      });

      it('不能查看使用者名單', async () => {
        const user = createTestCaller(db, 'member-id', role);

        await forbidden(() => user.user.list({}));
      });

      it('仍可查看財產、類別與盤點計畫', async () => {
        const user = createTestCaller(db, 'member-id', role);

        expect(await user.asset.list({})).toHaveLength(1);
        expect((await user.asset.get({ id: assetId })).id).toBe(assetId);
        expect(await user.category.list({})).toHaveLength(1);
        expect((await user.inventory.get({ id: planId }))?.id).toBe(planId);
      });
    });
  }

  it('多角色字串中含 admin 也視為管理員', async () => {
    const multi = createTestCaller(db, 'multi-id', 'user, admin');

    const updated = await multi.asset.update({ id: assetId, name: '新名稱' });
    expect(updated.name).toBe('新名稱');
  });
});

describe('hasRole', () => {
  it('比對單一與逗號分隔的多角色', () => {
    expect(hasRole('admin', 'admin')).toBe(true);
    expect(hasRole('user,admin', 'admin')).toBe(true);
    expect(hasRole('user', 'admin')).toBe(false);
  });

  it('不做部分字串比對，空值一律 false', () => {
    expect(hasRole('superadmin', 'admin')).toBe(false);
    expect(hasRole(null, 'admin')).toBe(false);
    expect(hasRole('admin,', '')).toBe(false);
  });
});

describe('resolveIamRole', () => {
  const originalFetch = globalThis.fetch;
  const users = [
    { email: 'Admin@Example.test', id: 'iam-1', role: 'admin' },
    { email: 'member@example.test', id: 'iam-2', role: 'user' },
  ].map((v) => ({
    ...v,
    banned: false,
    banReason: null,
    createdAt: new Date().toISOString(),
    displayUsername: null,
    username: v.id,
  }));

  beforeAll(() => {
    resetIamUsersCache();
    globalThis.fetch = (() =>
      Promise.resolve(
        Response.json([
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
        ]),
      )) as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    resetIamUsersCache();
  });

  it('以 email（不分大小寫）對應 IAM 使用者的角色', async () => {
    expect(await resolveIamRole('admin@example.test')).toBe('admin');
    expect(await resolveIamRole(' MEMBER@example.test ')).toBe('user');
  });

  it('找不到或沒有 email 時回傳 null', async () => {
    expect(await resolveIamRole('nobody@example.test')).toBeNull();
    expect(await resolveIamRole(undefined)).toBeNull();
  });
});
