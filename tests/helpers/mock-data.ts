import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';

export const BASE_ASSET = {
  borrowRule: BorrowRule.Public,
  custodian: 'cmrdb',
  location: '主顧 304',
  name: '鉛筆',
  ownershipType: OwnershipType.Cmrdb,
} as const;

export const BASE_ASSET_RECORD = {
  quantity: 5,
  status: AssetStatus.Normal,
} as const;

export const BORROW_DATES = {
  borrowDate: new Date('2026-01-01'),
  expectedReturnDate: new Date('2026-01-15'),
} as const;

export const MOCK_USER_ID = 'test-user-id';

export const PLAN_DATES = {
  dueAt: new Date('2026-06-30'),
  startAt: new Date('2026-06-01'),
} as const;
