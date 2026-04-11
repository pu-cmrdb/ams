import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { BorrowRule, RecordStatus } from '@/lib/enums';

import { BASE_ASSET, BASE_ASSET_RECORD, BORROW_DATES } from '../helpers/mock-data';
import { MOCK_USER_ID, createTestCaller } from '../helpers/caller';
import { createTestDb } from '../helpers/db';

import type { TestDb, TestSqlite } from '../helpers/db';

describe('borrow router', () => {
  let db: TestDb;
  let client: TestSqlite;
  let caller: ReturnType<typeof createTestCaller>;
  let categoryId: string;

  beforeEach(async () => {
    ({ client, db } = createTestDb());
    caller = createTestCaller(db);

    const { result } = await caller.category.create({ name: '文具' });
    categoryId = result.id;
  });

  afterEach(() => {
    client.close(false);
  });

  async function createPublicAsset(quantity = 5) {
    return caller.asset.create({
      ...BASE_ASSET,
      categoryId,
      records: [{ ...BASE_ASSET_RECORD, quantity }],
    });
  }

  describe('create', () => {
    it('creates a borrow record for a public asset', async () => {
      const asset = await createPublicAsset();

      const result = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 2,
      });

      expect(result.assetId).toBe(asset.id);
      expect(result.creatorId).toBe(MOCK_USER_ID);
      expect(result.recordStatus).toBe(RecordStatus.Active);
      expect(result.quantity).toBe(2);
      expect(result.asset.id).toBe(asset.id);
    });

    it('throws BAD_REQUEST for a nonexistent asset', async () => {
      const err = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: 'nonexistent',
        borrowerId: '借用人一',
        quantity: 1,
      }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('throws FORBIDDEN for an asset with borrow rule none', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        borrowRule: BorrowRule.None,
        categoryId,
        records: [{ ...BASE_ASSET_RECORD }],
      });

      const err = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'FORBIDDEN' });
    });

    it('throws FORBIDDEN for a restricted asset when caller is not an authorized lender', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        authorizedLenderIds: ['其他使用者'],
        borrowRule: BorrowRule.Restricted,
        categoryId,
        records: [{ ...BASE_ASSET_RECORD }],
      });

      const err = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'FORBIDDEN' });
    });

    it('succeeds for a restricted asset when caller is an authorized lender', async () => {
      const asset = await caller.asset.create({
        ...BASE_ASSET,
        authorizedLenderIds: [MOCK_USER_ID],
        borrowRule: BorrowRule.Restricted,
        categoryId,
        records: [{ ...BASE_ASSET_RECORD }],
      });

      const result = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      expect(result.assetId).toBe(asset.id);
    });

    it('throws BAD_REQUEST when quantity exceeds available stock', async () => {
      const asset = await createPublicAsset(3);

      const err = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 10,
      }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('accounts for already-borrowed quantity when checking stock', async () => {
      const asset = await createPublicAsset(3);

      await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 2,
      });

      const err = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人二',
        quantity: 2,
      }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('get', () => {
    it('returns a borrow record with asset', async () => {
      const asset = await createPublicAsset();

      const created = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      const fetched = await caller.borrow.get({ id: created.id });

      expect(fetched.id).toBe(created.id);
      expect(fetched.asset).toBeDefined();
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.borrow.get({ id: 'nonexistent' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('list', () => {
    it('returns all borrow records', async () => {
      const asset = await createPublicAsset();
      await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人二',
        quantity: 1,
      });

      const result = await caller.borrow.list({});

      expect(result).toHaveLength(2);
    });

    it('filters by assetId', async () => {
      const asset1 = await createPublicAsset();

      const asset2 = await caller.asset.create({
        ...BASE_ASSET,
        categoryId,
        records: [{ ...BASE_ASSET_RECORD }],
      });

      await caller.borrow.create({ ...BORROW_DATES, assetId: asset1.id, borrowerId: '借甲', quantity: 1 });
      await caller.borrow.create({ ...BORROW_DATES, assetId: asset2.id, borrowerId: '借乙', quantity: 1 });

      const result = await caller.borrow.list({ assetId: asset1.id });

      expect(result).toHaveLength(1);
      expect(result[0]?.assetId).toBe(asset1.id);
    });

    it('filters by recordStatus', async () => {
      const asset = await createPublicAsset();

      const created = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      await caller.borrow.update({
        id: created.id,
        recordStatus: RecordStatus.Returned,
      });

      const active = await caller.borrow.list({ recordStatus: RecordStatus.Active });
      const returned = await caller.borrow.list({ recordStatus: RecordStatus.Returned });

      expect(active).toHaveLength(0);
      expect(returned).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates borrow record fields (creator only)', async () => {
      const asset = await createPublicAsset();

      const created = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      const updated = await caller.borrow.update({
        id: created.id,
        notes: 'Updated notes',
        recordStatus: RecordStatus.Returned,
      });

      expect(updated.notes).toBe('Updated notes');
      expect(updated.recordStatus).toBe(RecordStatus.Returned);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      const err = await caller.borrow.update({ id: 'nonexistent' }).catch((e: unknown) => e);

      expect(err).toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws FORBIDDEN when a non-creator tries to update', async () => {
      const asset = await createPublicAsset();

      const created = await caller.borrow.create({
        ...BORROW_DATES,
        assetId: asset.id,
        borrowerId: '借用人一',
        quantity: 1,
      });

      const otherCaller = createTestCaller(db, '其他使用者');

      const err = await otherCaller.borrow.update({ id: created.id, notes: 'Hacked' }).catch((e: unknown) => e);
      expect(err).toMatchObject({ code: 'FORBIDDEN' });
    });
  });
});
