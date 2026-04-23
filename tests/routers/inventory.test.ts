import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import assert from 'assert';

import { BASE_ASSET, BASE_ASSET_RECORD, MOCK_USER_ID, PLAN_DATES } from '../helpers/mock-data';
import { createTestCaller } from '../helpers/caller';
import { createTestDb } from '../helpers/db';

import type { TestDb, TestSqlite } from '../helpers/db';

describe('inventory router', () => {
  let db: TestDb;
  let client: TestSqlite;
  let caller: ReturnType<typeof createTestCaller>;
  let categoryId: string;
  let assetId: string;

  beforeEach(async () => {
    ({ client, db } = createTestDb());
    caller = createTestCaller(db);

    const { result: category } = await caller.category.create({ name: '測試類別' });
    categoryId = category.id;

    const asset = await caller.asset.create({
      ...BASE_ASSET,
      categoryId,
      records: [{ ...BASE_ASSET_RECORD }],
    });
    assetId = asset.id;
  });

  afterEach(() => {
    client.close(false);
  });

  describe('create', () => {
    it('creates an inventory plan with assets and assignees', async () => {
      const plan = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [assetId],
        assigneeIds: ['使用者甲', '使用者乙'],
        description: '年度盤點檢查',
        name: '第二季盤點',
      });

      expect(plan.name).toBe('第二季盤點');
      expect(plan.createdById).toBe(MOCK_USER_ID);
      expect(plan.status).toBe('pending');
      expect(plan.assetIds).toContain(assetId);
      expect(plan.assigneeIds).toHaveLength(2);
    });

    it('creates a plan with empty asset and assignee lists', async () => {
      const plan = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [],
        assigneeIds: [],
        description: '空計畫',
        name: '空計畫',
      });

      expect(plan.assetIds).toHaveLength(0);
      expect(plan.assigneeIds).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('returns an empty list when no plans exist', async () => {
      const result = await caller.inventory.list({});

      expect(result).toHaveLength(0);
    });

    it('returns all plans with assignedToIds', async () => {
      await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [],
        assigneeIds: ['使用者甲'],
        description: '計畫一',
        name: '計畫一',
      });

      await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [],
        assigneeIds: ['使用者乙'],
        description: '計畫二',
        name: '計畫二',
      });

      const result = await caller.inventory.list({});

      expect(result).toHaveLength(2);
      expect(result[0]?.assignedToIds).toBeDefined();
    });

    it('respects limit and offset', async () => {
      for (let i = 0; i < 4; i++) {
        await caller.inventory.create({
          ...PLAN_DATES,
          assetIds: [],
          assigneeIds: [],
          description: `計畫 ${i}`,
          name: `計畫 ${i}`,
        });
      }

      const page = await caller.inventory.list({ limit: 2, offset: 1 });

      expect(page).toHaveLength(2);
    });
  });

  describe('get', () => {
    it('returns the plan with assetIds and assigneeIds', async () => {
      const created = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [assetId],
        assigneeIds: ['使用者甲'],
        description: '完整計畫說明',
        name: '完整計畫',
      });

      const fetched = await caller.inventory.get({ id: created.id });

      expect(fetched).not.toBeNull();
      assert(fetched !== null);
      expect(fetched.id).toBe(created.id);
      expect(fetched.assetIds).toContain(assetId);
      expect(fetched.assigneeIds).toContain('使用者甲');
    });

    it('returns null for a missing id', async () => {
      const result = await caller.inventory.get({ id: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates plan name and status', async () => {
      const created = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [],
        assigneeIds: [],
        description: '原始說明',
        name: '原始名稱',
      });

      const updated = await caller.inventory.update({
        id: created.id,
        name: '更新名稱',
        status: 'completed',
      });

      expect(updated.name).toBe('更新名稱');
      expect(updated.status).toBe('completed');
    });

    it('replaces assetIds when provided', async () => {
      const plan = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [assetId],
        assigneeIds: [],
        description: '計畫',
        name: '計畫',
      });

      const updated = await caller.inventory.update({ assetIds: [], id: plan.id });

      expect(updated.assetIds).toHaveLength(0);
    });

    it('replaces assigneeIds when provided', async () => {
      const plan = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [],
        assigneeIds: ['使用者甲'],
        description: '計畫',
        name: '計畫',
      });

      const updated = await caller.inventory.update({
        assigneeIds: ['使用者乙', '使用者丙'],
        id: plan.id,
      });

      expect(updated.assigneeIds).toHaveLength(2);
      expect(updated.assigneeIds).toContain('使用者乙');
    });

    it('preserves existing assetIds when not provided', async () => {
      const plan = await caller.inventory.create({
        ...PLAN_DATES,
        assetIds: [assetId],
        assigneeIds: [],
        description: '計畫',
        name: '計畫',
      });

      const updated = await caller.inventory.update({ id: plan.id, name: '重新命名' });

      expect(updated.assetIds).toContain(assetId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.inventory.update({ id: 'nonexistent', name: '甲' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
