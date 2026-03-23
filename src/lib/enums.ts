import { defineEnum } from '@/lib/utils';

/** 財產排序設定 */
export const AssetsSortKey = defineEnum({
  /** 根據群組 */
  CategoryId: 'categoryId',
  /** 根據建立時間 */
  CreatedAt: 'createdAt',
  /** 根據名稱 */
  Name: 'name',
  /** 根據狀態 */
  Status: 'status',
  /** 根據更新時間 */
  UpdatedAt: 'updatedAt',
} as const);
export type AssetsSortKey = typeof AssetsSortKey.$schema.infer;

/** 狀態設定 */
export const AssetStatus = defineEnum({
  /** 借來的 */
  Borrowed: 'borrowed',
  /** 遺失 */
  Lost: 'lost',
  /** 正常 */
  Normal: 'normal',
  /** 修理 */
  Repairing: 'repairing',
  /** 報廢 */
  Scrapped: 'scrapped',
} as const);
export type AssetStatus = typeof AssetStatus.$schema.infer;

/** 出借權限 */
export const BorrowRule = defineEnum({
  /** 不可借 */
  None: 'none',
  /** 所有人可借 */
  Public: 'public',
  /** 限授權人開單 */
  Restricted: 'restricted',
} as const);
export type BorrowRule = typeof BorrowRule.$schema.infer;

/** 財產類別排序設定 */
export const CategorySortKey = defineEnum({
  /** 根據建立時間 */
  CreatedAt: 'createdAt',
  /** 根據名稱 */
  Name: 'name',
  /** 根據更新時間 */
  UpdatedAt: 'updatedAt',
} as const);
export type CategorySortKey = typeof CategorySortKey.$schema.infer;

/** 歸屬單位 */
export const OwnershipType = defineEnum({
  /** 行雲者 */
  Cmrdb: 'cmrdb',
  /** 學校 */
  School: 'school',
} as const);
export type OwnershipType = typeof OwnershipType.$schema.infer;

/** 單據狀態 */
export const RecordStatus = defineEnum({
  /** 借用中 */
  Active: 'active',
  /** 已歸還 */
  Returned: 'returned',
} as const);
export type RecordStatus = typeof RecordStatus.$schema.infer;

/** 排序方向 */
export const SortDirection = defineEnum({
  /** 升序 => 小 → 大 / A → Z / 舊 → 新 */
  Asc: 'asc',
  /** 降序 => 大 → 小 / Z → A / 新 → 舊 */
  Desc: 'desc',
} as const);
export type SortDirection = typeof SortDirection.$schema.infer;
