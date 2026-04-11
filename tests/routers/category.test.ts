import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { createTestCaller } from '../helpers/caller';
import { createTestDb } from '../helpers/db';

import type { TestDb, TestSqlite } from '../helpers/db';

describe('category router', () => {
  let db: TestDb;
  let client: TestSqlite;
  let caller: ReturnType<typeof createTestCaller>;

  beforeEach(() => {
    ({ client, db } = createTestDb());
    caller = createTestCaller(db);
  });

  afterEach(() => {
    client.close(false);
  });

  describe('create', () => {
    it('creates a category and returns it', async () => {
      const { result } = await caller.category.create({ name: '電子產品' });

      expect(result.name).toBe('電子產品');
      expect(result.id).toBeTruthy();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('throws CONFLICT for a duplicate name', async () => {
      await caller.category.create({ name: '電子產品' });

      const err = await caller.category.create({ name: '電子產品' }).catch((e: unknown) => e);
      expect(err).toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('list', () => {
    it('returns an empty list when no categories exist', async () => {
      const result = await caller.category.list({});

      expect(result).toHaveLength(0);
    });

    it('returns all categories', async () => {
      await caller.category.create({ name: '電子產品' });
      await caller.category.create({ name: '工具' });

      const result = await caller.category.list({});

      expect(result).toHaveLength(2);
    });

    it('filters by keyword (case-insensitive substring)', async () => {
      await caller.category.create({ name: '電子產品' });
      await caller.category.create({ name: '工具' });

      const result = await caller.category.list({ keyword: '電子' });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('電子產品');
    });

    it('respects limit and offset', async () => {
      await caller.category.create({ name: '甲' });
      await caller.category.create({ name: '乙' });
      await caller.category.create({ name: '丙' });

      const page = await caller.category.list({ limit: 2, offset: 1 });

      expect(page).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates the category name', async () => {
      const { result: created } = await caller.category.create({ name: '電子產絣' });

      const updated = await caller.category.update({ id: created.id, name: '電子產品' });

      expect(updated.name).toBe('電子產品');
    });

    it('no-ops when the name is unchanged', async () => {
      const { result: created } = await caller.category.create({ name: '電子產品' });

      const updated = await caller.category.update({ id: created.id, name: '電子產品' });

      expect(updated.name).toBe('電子產品');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.category.update({ id: 'nonexistent', name: '測試' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws CONFLICT when renaming to an existing name', async () => {
      const { result: a } = await caller.category.create({ name: '甲' });
      await caller.category.create({ name: '乙' });

      const err = await caller.category.update({ id: a.id, name: '乙' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('delete', () => {
    it('deletes a category and reports success', async () => {
      const { result } = await caller.category.create({ name: '刪除' });

      const res = await caller.category.delete({ id: result.id });

      expect(res.success).toBe(true);
      expect(res.deletedCategoryId).toBe(result.id);
      expect(res.deletedAssetCount).toBe(0);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.category.delete({ id: 'nonexistent' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
