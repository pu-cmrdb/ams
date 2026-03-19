import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  /** 財產授權出借人表（asset_authorized_lenders）關聯定義 */
  assetAuthorizedLenders: {
    /** 對應的財產資料 */
    asset: r.one.assets({
      from: r.assetAuthorizedLenders.assetId,
      to: r.assets.id,
    }),
  },
  /** 財產圖片對照表（asset_images）關聯定義 */
  assetImages: {
    /** 對應的財產 */
    asset: r.one.assets({
      from: r.assetImages.assetId,
      to: r.assets.id,
    }),
    /** 對應的圖片 */
    image: r.one.images({
      from: r.assetImages.imageId,
      to: r.images.id,
    }),
  },
  /** 財產表（assets）關聯定義 */
  assets: {
    /** 財產的附圖列表（透過 asset_images 建立多對多關聯） */
    assetImages: r.many.assetImages(),
    /** 財產可被哪些使用者授權出借 */
    authorizedLenders: r.many.assetAuthorizedLenders(),
    /** 此財產的所有借用紀錄 */
    borrowRecords: r.many.borrowRecords(),
    /** 此財產所屬的財產類別 */
    category: r.one.categories({
      from: r.assets.categoryId,
      to: r.categories.id,
    }),
    /** 此財產設定的主圖（封面圖） */
    image: r.one.images({
      from: r.assets.imageHash,
      to: r.images.id,
    }),
  },
  /** 財產借用紀錄表（borrow_records）關聯定義 */
  borrowRecords: {
    /** 此借用紀錄所借出的財產 */
    asset: r.one.assets({
      from: r.borrowRecords.assetId,
      to: r.assets.id,
    }),
  },
  /** 財產類別表（categories）關聯定義 */
  categories: {
    /** 此類別下的所有財產 */
    assets: r.many.assets(),
  },
  /** 圖片表（images）關聯定義 */
  images: {
    /** 此圖片作為附圖被哪些財產引用 */
    assetImages: r.many.assetImages(),
    /** 此圖片作為主圖被哪些財產引用 */
    assets: r.many.assets(),
  },
  /** 盤點計畫指派人員表（inventory_plan_assignees）關聯定義 */
  inventoryPlanAssignees: {
    /** 此指派紀錄所屬的盤點計畫 */
    plan: r.one.inventoryPlans({
      from: r.inventoryPlanAssignees.planId,
      to: r.inventoryPlans.id,
    }),
  },
  /** 盤點計畫表（inventory_plans）關聯定義 */
  inventoryPlans: {
    /** 此盤點計畫所指派的所有人員 */
    assignees: r.many.inventoryPlanAssignees(),
  },
}));
