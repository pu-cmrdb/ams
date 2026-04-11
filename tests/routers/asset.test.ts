import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';

import { MOCK_USER_ID, createTestCaller } from '../helpers/caller';
import { BASE_ASSET } from '../helpers/mock-data';
import { createTestDb } from '../helpers/db';

import type { TestDb, TestSqlite } from '../helpers/db';

describe('asset router', () => {
  let db: TestDb;
  let client: TestSqlite;
  let caller: ReturnType<typeof createTestCaller>;
  let categoryId: string;

  beforeEach(async () => {
    ({ client, db } = createTestDb());
    caller = createTestCaller(db);

    const { result } = await caller.category.create({ name: '測試類別' });

    categoryId = result.id;
  });

  afterEach(() => {
    client.close(false);
  });

  describe('create', () => {
    it('creates a cmrdb asset', async () => {
      const asset = await caller.asset.create({ ...BASE_ASSET, categoryId });

      expect(asset.name).toBe('鉛筆');
      expect(asset.ownershipType).toBe(OwnershipType.Cmrdb);
      expect(asset.createdById).toBe(MOCK_USER_ID);
      expect(asset.updatedById).toBe(MOCK_USER_ID);
    });

    it('creates a school asset with schoolAssetNumber', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        ownershipType: OwnershipType.School,
        schoolAssetNumber: 'SCH-001',
      });

      expect(asset.ownershipType).toBe(OwnershipType.School);
      expect(asset.schoolAssetNumber).toBe('SCH-001');
    });

    it('creates a restricted asset with authorizedLenderIds', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        authorizedLenderIds: ['貸款人一', '貸款人二'],
        borrowRule: BorrowRule.Restricted,
        categoryId,
      });

      expect(asset.borrowRule).toBe(BorrowRule.Restricted);
    });

    it('creates an asset with initial records', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [
          { quantity: 5, status: AssetStatus.Normal },
          { quantity: 1, status: AssetStatus.Repairing },
        ],
      });

      const fetched = await caller.asset.get({ id: asset.id });
      expect(fetched.records).toHaveLength(2);

      const normal = fetched.records.find((r) => r.status === AssetStatus.Normal);
      expect(normal?.quantity).toBe(5);
    });

    it('merges duplicate-status records on create', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [
          { quantity: 3, status: AssetStatus.Normal },
          { quantity: 2, status: AssetStatus.Normal },
        ],
      });

      const fetched = await caller.asset.get({ id: asset.id });

      const normal = fetched.records.find((r) => r.status === AssetStatus.Normal);
      expect(normal?.quantity).toBe(5);
    });
  });

  describe('list', () => {
    it('returns an empty list when no assets exist', async () => {
      const result = await caller.asset.list({});

      expect(result).toHaveLength(0);
    });

    it('returns assets with category and records', async () => {
      await caller.asset.create({ ...BASE_ASSET, categoryId });
      const result = await caller.asset.list({});

      expect(result).toHaveLength(1);
      expect(result[0]?.category).toBeDefined();
      expect(result[0]?.records).toBeDefined();
    });

    it('filters by keyword', async () => {
      await caller.asset.create({ ...BASE_ASSET, categoryId, name: '筆記型電腦' });
      await caller.asset.create({ ...BASE_ASSET, categoryId, name: '螢幕' });

      const result = await caller.asset.list({ keyword: '筆記' });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('筆記型電腦');
    });

    it('filters by categoryId', async () => {
      const { result: cat2 } = await caller.category.create({ name: '其他' });

      await caller.asset.create({ ...BASE_ASSET, categoryId, name: '資產甲' });
      await caller.asset.create({ ...BASE_ASSET, categoryId: cat2.id, name: '資產乙' });

      const result = await caller.asset.list({ categoryId });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('資產甲');
    });

    it('filters by ownershipType', async () => {
      await caller.asset.create({ ...BASE_ASSET, categoryId, ownershipType: OwnershipType.Cmrdb });
      await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        name: '學校資產',
        ownershipType: OwnershipType.School,
        schoolAssetNumber: 'SCH-001',
      });

      const result = await caller.asset.list({ ownershipType: OwnershipType.School });

      expect(result).toHaveLength(1);
      expect(result[0]?.ownershipType).toBe(OwnershipType.School);
    });

    it('respects limit and offset', async () => {
      for (let i = 0; i < 5; i++) {
        await caller.asset.create({ ...BASE_ASSET, categoryId, name: `資產 ${i}` });
      }

      const page = await caller.asset.list({ limit: 2, offset: 2 });
      expect(page).toHaveLength(2);
    });
  });

  describe('get', () => {
    it('returns an asset with all relations', async () => {
      const created = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [{ quantity: 3, status: AssetStatus.Normal }],
      });

      const asset = await caller.asset.get({ id: created.id });

      expect(asset.id).toBe(created.id);
      expect(asset.category).toBeDefined();
      expect(asset.records).toHaveLength(1);
      expect(asset.borrowRecords).toBeDefined();
      expect(asset.authorizedLenders).toBeDefined();
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.asset.get({ id: 'nonexistent' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('update', () => {
    it('updates asset fields', async () => {
      const created = await caller.asset.create({ ...BASE_ASSET, categoryId });

      const updated = await caller.asset.update({
        custodian: '更新部門',
        id: created.id,
        name: '更新名稱',
      });

      expect(updated.name).toBe('更新名稱');
      expect(updated.custodian).toBe('更新部門');
      expect(updated.updatedById).toBe(MOCK_USER_ID);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.asset.update({ id: 'nonexistent', name: '甲' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });

    it('updates authorizedLenderIds when switching to restricted', async () => {
      const created = await caller.asset.create({ ...BASE_ASSET, categoryId });

      const updated = await caller.asset.update({
        authorizedLenderIds: ['貸款人一'],
        borrowRule: BorrowRule.Restricted,
        id: created.id,
      });

      expect(updated.borrowRule).toBe(BorrowRule.Restricted);
      expect(updated.authorizedLenders).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('deletes an asset', async () => {
      const created = await caller.asset.create({ ...BASE_ASSET, categoryId });
      const res = await caller.asset.delete({ id: created.id });

      expect(res.success).toBe(true);

      const err = await caller.asset.get({ id: created.id }).catch((e: unknown) => e);
      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('updateRecord', () => {
    it('replaces all records for an asset', async () => {
      const created = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [{ quantity: 5, status: AssetStatus.Normal }],
      });

      await caller.asset.updateRecord({
        id: created.id,
        records: [
          { quantity: 3, status: AssetStatus.Normal },
          { quantity: 1, status: AssetStatus.Lost },
        ],
      });

      const asset = await caller.asset.get({ id: created.id });
      expect(asset.records).toHaveLength(2);
    });

    it('clears all records when given an empty array', async () => {
      const created = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [{ quantity: 5, status: AssetStatus.Normal }],
      });

      await caller.asset.updateRecord({ id: created.id, records: [] });

      const asset = await caller.asset.get({ id: created.id });
      expect(asset.records).toHaveLength(0);
    });
  });
});
