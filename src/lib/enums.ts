import { defineEnum } from '@/lib/utils';
import type { z } from '@/lib/zod';

/** 財產排序設定 */
export const AssetsSortKey = defineEnum({
  /** 根據群組 */
  CategoryId: 'categoryId',
  /** 根據建立時間 */
  CreatedAt: 'createdAt',
  /** 根據名稱 */
  Name: 'name',
  /** 根據更新時間 */
  UpdatedAt: 'updatedAt',
} as const);
export type AssetsSortKey = z.infer<typeof AssetsSortKey.$schema>;

/** 狀態設定 */
export const AssetStatus = defineEnum({
  /** 遺失 */
  Lost: 'lost',
  /** 在庫 */
  Normal: 'normal',
  /** 維修 */
  Repairing: 'repairing',
  /** 報廢 */
  Scrapped: 'scrapped',
} as const);
export type AssetStatus = z.infer<typeof AssetStatus.$schema>;

/** 出借權限 */
export const BorrowRule = defineEnum({
  /** 不可借 */
  None: 'none',
  /** 所有人可借 */
  Public: 'public',
  /** 限授權人開單 */
  Restricted: 'restricted',
} as const);
export type BorrowRule = z.infer<typeof BorrowRule.$schema>;

/** 財產類別排序設定 */
export const CategorySortKey = defineEnum({
  /** 根據建立時間 */
  CreatedAt: 'createdAt',
  /** 根據名稱 */
  Name: 'name',
  /** 根據更新時間 */
  UpdatedAt: 'updatedAt',
} as const);
export type CategorySortKey = z.infer<typeof CategorySortKey.$schema>;

/** 歸屬單位 */
export const OwnershipType = defineEnum({
  /** 行雲者 */
  Cmrdb: 'cmrdb',
  /** 學校 */
  School: 'school',
} as const);
export type OwnershipType = z.infer<typeof OwnershipType.$schema>;

/** 單據狀態 */
export const RecordStatus = defineEnum({
  /** 借用中 */
  Active: 'active',
  /** 已歸還 */
  Returned: 'returned',
} as const);
export type RecordStatus = z.infer<typeof RecordStatus.$schema>;

/** 排序方向 */
export const SortDirection = defineEnum({
  /** 升序 => 小 → 大 / A → Z / 舊 → 新 */
  Ascending: 'asc',
  /** 降序 => 大 → 小 / Z → A / 新 → 舊 */
  Descending: 'desc',
} as const);
export type SortDirection = z.infer<typeof SortDirection.$schema>;

/** 借閱記錄排序設定 */
export const BorrowRecordSortKey = defineEnum({
  /** 根據借用時間 */
  BorrowDate: 'borrowDate',
  /** 根據建立時間 */
  CreatedAt: 'createdAt',
  /** 根據預計歸還時間 */
  ExpectedReturnDate: 'expectedReturnDate',
  /** 根據更新時間 */
  UpdatedAt: 'updatedAt',
} as const);
export type BorrowRecordSortKey = z.infer<typeof BorrowRecordSortKey.$schema>;

/** 盤點計劃狀態 */
export const InventoryPlanStatus = defineEnum({
  /** 已取消 */
  Cancelled: 'cancelled',
  /** 已完成 */
  Completed: 'completed',
  /** 待處理 */
  Pending: 'pending',
} as const);
export type InventoryPlanStatus = z.infer<typeof InventoryPlanStatus.$schema>;
