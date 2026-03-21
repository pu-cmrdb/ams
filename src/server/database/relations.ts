import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  /** 財產授權出借人表（asset_authorized_lenders）關聯定義 */
  assetAuthorizedLenders: {
    asset: r.one.assets({
      from: r.assetAuthorizedLenders.assetId,
      to: r.assets.id,
    }),
  },
  /** 財產圖片對照表（asset_images）關聯定義 */
  assetImages: {
    asset: r.one.assets({
      from: r.assetImages.assetId,
      to: r.assets.id,
    }),
    image: r.one.images({
      from: r.assetImages.imageId,
      to: r.images.id,
    }),
  },
  /** 財產表（assets）關聯定義 */
  assets: {
    assetImages: r.many.assetImages(),
    authorizedLenders: r.many.assetAuthorizedLenders(),
    borrowRecords: r.many.borrowRecords(),
    category: r.one.categories({
      from: r.assets.categoryId,
      to: r.categories.id,
    }),
    image: r.one.images({
      from: r.assets.imageHash,
      to: r.images.id,
    }),
  },
  /** 財產借用紀錄表（borrow_records）關聯定義 */
  borrowRecords: {
    asset: r.one.assets({
      from: r.borrowRecords.assetId,
      to: r.assets.id,
    }),
  },
  /** 財產類別表（categories）關聯定義 */
  categories: {
    assets: r.many.assets(),
  },
  /** 圖片表（images）關聯定義 */
  images: {
    assetImages: r.many.assetImages(),
    assets: r.many.assets(),
  },
  /** 盤點計畫指派人員表（inventory_plan_assignees）關聯定義 */
  inventoryPlanAssignees: {
    plan: r.one.inventoryPlans({
      from: r.inventoryPlanAssignees.planId,
      to: r.inventoryPlans.id,
    }),
  },
  /** 盤點計畫表（inventory_plans）關聯定義 */
  inventoryPlans: {
    assignees: r.many.inventoryPlanAssignees(),
  },
}));
