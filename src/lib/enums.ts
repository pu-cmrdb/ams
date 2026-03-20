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
export type AssetsStatus = typeof ASSETS_STATUS[keyof typeof ASSETS_STATUS];
export const AssetsStatusSchema = type.valueOf(ASSETS_STATUS);
export const ASSETS_STATUS_ENUM = valuesToTuple(ASSETS_STATUS);

/** 出借權限 */
export const BORROW_ROLE = {
  /** 不可借 */
  NONE: 'none',
  /** 所有人可借 */
  PUBLIC: 'public',
  /** 限授權人開單 */
  RESTRICTED: 'restricted',
} as const;
export type BorrowRole = typeof BORROW_ROLE[keyof typeof BORROW_ROLE];
export const BorrowRoleSchema = type.valueOf(BORROW_ROLE);
export const BORROW_ROLE_ENUM = valuesToTuple(BORROW_ROLE);

/** 單據狀態 */
export const RECORD_STATUS = {
  /** 借用中 */
  ACTIVE: 'active',
  /** 已歸還 */
  RETURNED: 'returned',
} as const;
export type RecordStatus = typeof RECORD_STATUS[keyof typeof RECORD_STATUS];
export const RecordStatusSchema = type.valueOf(RECORD_STATUS);
export const RECORD_STATUS_ENUM = valuesToTuple(RECORD_STATUS);

/** 歸屬單位 */
export const OWNERSHIP_TYPE = {
  /** 行雲者 */
  CMRDB: 'cmrdb',
  /** 學校 */
  SCHOOL: 'school',
} as const;
export type OwnerShip = typeof OWNERSHIP_TYPE[keyof typeof OWNERSHIP_TYPE];
export const OwnerShipTypeSchema = type.valueOf(OWNERSHIP_TYPE);
export const OWNERSHIP_TYPE_ENUM = valuesToTuple(OWNERSHIP_TYPE);

/** 財產排序設定 */
export const ASSETS_SORT_KEYS = {
  /** 根據群組 */
  CATEGORYId: 'categoryId',
  /** 根據建立時間 */
  CREATEDAT: 'createdAt',
  /** 根據名稱 */
  NAME: 'name',
  /** 根據狀態 */
  STATUS: 'status',
  /** 根據建立時間 */
  UPDATEDAT: 'updatedAt',
} as const;
export type AssetsSortKey = typeof ASSETS_SORT_KEYS[keyof typeof ASSETS_SORT_KEYS];
export const AssetsSortKeySchema = type.valueOf(ASSETS_SORT_KEYS);

/** 財產類別排序設定 */
export const CATEGORY_SORT_KEYS = {
  /** 根據建立時間 */
  CREATEDAT: 'createdAt',
  /** 根據名稱 */
  NAME: 'name',
  /** 根據建立時間 */
  UPDATEDAT: 'updatedAt',
} as const;
export type CategorySortKey = typeof CATEGORY_SORT_KEYS[keyof typeof CATEGORY_SORT_KEYS];
export const CategorySortKeySchema = type.valueOf(CATEGORY_SORT_KEYS);

/** 排序方向 */
export const SORT_DIRECTION = {
  /** 升序 => 小 → 大 / A → Z / 舊 → 新 */
  ASC: 'asc',
  /** 降序 => 大 → 小 / Z → A / 新 → 舊 */
  DESC: 'desc',
} as const;

export type SortDirection = typeof SORT_DIRECTION[keyof typeof SORT_DIRECTION];
export const SortDirectionSchema = type.valueOf(SORT_DIRECTION);
