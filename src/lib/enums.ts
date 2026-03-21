import { type } from 'arktype';

import { valuesToTuple } from '@/lib/utils';

/** 狀態設定 */
export const ASSETS_STATUS = {
  /** 借來的 */
  BORROWED: 'borrowed',
  /** 遺失 */
  LOST: 'lost',
  /** 正常 */
  NORMAL: 'normal',
  /** 修理 */
  REPAIRING: 'repairing',
  /** 報廢 */
  SCRAPPED: 'scrapped',
} as const;
export type AssetsStatusType = typeof ASSETS_STATUS[keyof typeof ASSETS_STATUS];
export const AssetsStatusSchema = type.valueOf(ASSETS_STATUS);
export const ASSETS_STATUS_ENUM = valuesToTuple(ASSETS_STATUS);

/** 出借權限 */
export const BORROW_RULE = {
  /** 不可借 */
  NONE: 'none',
  /** 所有人可借 */
  PUBLIC: 'public',
  /** 限授權人開單 */
  RESTRICTED: 'restricted',
} as const;
export type BorrowRoleType = typeof BORROW_RULE[keyof typeof BORROW_RULE];
export const BorrowRoleSchema = type.valueOf(BORROW_RULE);
export const BORROW_RULE_ENUM = valuesToTuple(BORROW_RULE);

/** 單據狀態 */
export const RECORD_STATUS = {
  /** 借用中 */
  ACTIVE: 'active',
  /** 已歸還 */
  RETURNED: 'returned',
} as const;
export type RecordStatusType = typeof RECORD_STATUS[keyof typeof RECORD_STATUS];
export const RecordStatusSchema = type.valueOf(RECORD_STATUS);
export const RECORD_STATUS_ENUM = valuesToTuple(RECORD_STATUS);

/** 歸屬單位 */
export const OWNERSHIP_TYPE = {
  /** 行雲者 */
  CMRDB: 'cmrdb',
  /** 學校 */
  SCHOOL: 'school',
} as const;
export type OwnerShipType = typeof OWNERSHIP_TYPE[keyof typeof OWNERSHIP_TYPE];
export const OwnerShipTypeSchema = type.valueOf(OWNERSHIP_TYPE);
export const OWNERSHIP_TYPE_ENUM = valuesToTuple(OWNERSHIP_TYPE);

/** 財產排序設定 */
export const ASSETS_SORT_KEYS = {
  /** 根據群組 */
  CATEGORY_ID: 'categoryId',
  /** 根據建立時間 */
  CREATED_AT: 'createdAt',
  /** 根據名稱 */
  NAME: 'name',
  /** 根據狀態 */
  STATUS: 'status',
  /** 根據更新時間 */
  UPDATED_AT: 'updatedAt',
} as const;
export type AssetsSortKeyType = typeof ASSETS_SORT_KEYS[keyof typeof ASSETS_SORT_KEYS];
export const AssetsSortKeySchema = type.valueOf(ASSETS_SORT_KEYS);

/** 財產類別排序設定 */
export const CATEGORY_SORT_KEYS = {
  /** 根據建立時間 */
  CREATED_AT: 'createdAt',
  /** 根據名稱 */
  NAME: 'name',
  /** 根據更新時間 */
  UPDATED_AT: 'updatedAt',
} as const;
export type CategorySortKeyType = typeof CATEGORY_SORT_KEYS[keyof typeof CATEGORY_SORT_KEYS];
export const CategorySortKeySchema = type.valueOf(CATEGORY_SORT_KEYS);

/** 排序方向 */
export const SORT_DIRECTION = {
  /** 升序 => 小 → 大 / A → Z / 舊 → 新 */
  ASC: 'asc',
  /** 降序 => 大 → 小 / Z → A / 新 → 舊 */
  DESC: 'desc',
} as const;

export type SortDirectionType = typeof SORT_DIRECTION[keyof typeof SORT_DIRECTION];
export const SortDirectionSchema = type.valueOf(SORT_DIRECTION);

/** 借閱記錄排序設定 */
export const BORROW_RECORDS_SORT_KEYS = {
  /** 根據借用時間 */
  BORROW_DATE: 'borrowDate',
  /** 根據建立時間 */
  CREATED_AT: 'createdAt',
  /** 根據預計歸還時間 */
  EXPECTED_RETURN_DATE: 'expectedReturnDate',
  /** 根據更新時間 */
  UPDATED_AT: 'updatedAt',
} as const;
export type BorrowRecordsSortKeyType = typeof BORROW_RECORDS_SORT_KEYS[keyof typeof BORROW_RECORDS_SORT_KEYS];
export const BorrowRecordsSortKeySchema = type.valueOf(BORROW_RECORDS_SORT_KEYS);
