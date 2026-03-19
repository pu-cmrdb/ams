/* eslint-disable perfectionist/sort-objects */
/* eslint @stylistic/key-spacing: ['warn', {align: 'value'}] */

import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

import { BORROW_ROLE, BORROW_ROLE_ENUM, OWNERSHIP_TYPE_ENUM, RECORD_STATUS_ENUM, STATUS_ENUM, STATUS_VALUES } from '@/lib/utils';

const cascadeActions = {
  onDelete: 'cascade',
  onUpdate: 'cascade',
} as const;

/** 更新日期 */
const updatedAt = integer('updated_at', { mode: 'timestamp' })
  .default(sql`(unixepoch())`)
  .$onUpdate(() => /* @__PURE__ */ new Date()).notNull();

/** 建立日期 */
const createdAt = integer('created_at', { mode: 'timestamp' })
  .default(sql`(unixepoch())`)
  .notNull();

/** 財產 */
export const assets = sqliteTable('assets', {
  /** 財產 ID */
  id:                text('id').primaryKey(),
  /** 財產名稱 */
  name:              text('name').notNull(),
  /** 歸屬單位：school（學校列管）或 cmrdb（社團自購） */
  ownershipType:     text('ownership_type', { enum: OWNERSHIP_TYPE_ENUM }).notNull(),
  /** 學校產編：ownershipType 為 school 時必填 */
  schoolAssetNumber: text('school_asset_number'),
  /** 數量 */
  quantity:          integer('quantity').notNull(),
  /** 資產類別 UUID FK */
  categoryId:        text('category_id').notNull().references(() => categories.id, cascadeActions),
  /** 財產圖片 */
  imageHash:         text('image_hash').references(() => images.id, { onDelete: 'set null' }),
  /** 保管單位 */
  custodian:         text('custodian').notNull(),
  /** 財產補充說明，可記錄任何與此財產相關的額外資訊 */
  description:       text('description'),
  /** 建立財產的人的 ID */
  createdById:       text('created_by_id').notNull(),
  /** 最後更新此財產資料的人的 ID */
  updatedById:       text('updated_by_id').notNull(),
  /** 狀態 */
  status:            text('status', { enum: STATUS_ENUM }).notNull().default(STATUS_VALUES.NORMAL),
  /** 地點描述 */
  location:          text('location').notNull(),
  /** 購置日期 */
  purchaseDate:      integer('purchase_date', { mode: 'timestamp' }),
  /** 借用權限：public（所有人可借）、restricted（限授權人開單）、none（不可借） */
  borrowRule:        text('borrow_rule', { enum: BORROW_ROLE_ENUM }).notNull().default(BORROW_ROLE.PUBLIC),
  createdAt,
  updatedAt,
});

/** 財產類別 */
export const categories = sqliteTable('categories', {
  /** 財產類別 ID */
  id:   text('id').primaryKey(),
  /** 財產類別名稱 */
  name: text('name').notNull().unique(),
  createdAt,
  updatedAt,
});

/** 財產授權出借人表 */
export const assetAuthorizedLenders = sqliteTable('asset_authorized_lenders', {
  /** 對應 assets.id  ID */
  assetId: text('asset_id').notNull().references(() => assets.id, cascadeActions),
  /** 被授權可開立出借單的使用者 ID（對應 IAM User ID） */
  userId:  text('user_id').notNull(),
}, (table) => [
  primaryKey({
    columns: [table.assetId, table.userId],
  }),
]);

/** 財產借用紀錄表 */
export const borrowRecords = sqliteTable('borrow_records', {
  /** 借用紀錄主鍵 ID */
  id:                 text('id').primaryKey(),
  /** 借用的財產 */
  assetId:            text('asset_id').notNull().references(() => assets.id, cascadeActions),
  /** 開單人：只有此人有權限點擊「歸還」或修改此單據 */
  creatorId:          text('creator_id').notNull(),
  /** 實際借用人/拿走東西的人 */
  borrowerId:         text('borrower_id').notNull(),
  /** 單據狀態 */
  recordStatus:       text('record_status', { enum: RECORD_STATUS_ENUM }).notNull(),
  /** 借出時間 */
  borrowDate:         integer('borrow_date', { mode: 'timestamp' }).notNull(),
  /** 預計歸還時間 */
  expectedReturnDate: integer('expected_return_date', { mode: 'timestamp' }).notNull(),
  /** 實際歸還時間 */
  actualReturnDate:   integer('actual_return_date', { mode: 'timestamp' }),
  /** 備註 */
  notes:              text('notes'),
  createdAt,
  updatedAt,
});

export const inventoryPlans = sqliteTable('inventory_plans', {
  /** 盤點計畫唯一識別碼 */
  id:          text('id').primaryKey(),
  /** 盤點計畫名稱 */
  name:        text('name').notNull(),
  /** 盤點計畫敘述 */
  description: text('description').notNull(),
  /** 發起人的使用者 ID */
  createdById: text('created_by_id').notNull(),
  /** 盤點開始時間 */
  startAt:     integer('start_at', { mode: 'timestamp' }).notNull(),
  /** 盤點截止時間 */
  dueAt:       integer('due_at', { mode: 'timestamp' }).notNull(),
  /** 盤點完成時間，未完成時為 null */
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  /** 盤點範圍描述 */
  scope:       text('scope').notNull(),
  /** 盤點狀態，預設為 pending */
  status:      text('status', { enum: ['pending', 'completed', 'cancelled'] }).notNull().default('pending'),
  createdAt,
  updatedAt,
});

export const inventoryPlanAssignees = sqliteTable('inventory_plan_assignees', {
  /** 盤點計畫 ID */
  planId: text('plan_id').notNull().references(() => inventoryPlans.id, cascadeActions),
  /** 盤點人員使用者 ID */
  userId: text('user_id').notNull(),
});

export const images = sqliteTable('images', {
  /** 檔案 hash，同時作為主鍵與實體檔名 */
  id:               text('id').primaryKey(),
  /** 圖片標題 ALT */
  title:            text('title'),
  /** 圖片描述 */
  description:      text('description'),
  /** 來源名稱 */
  originalFilename: text('original_filename').notNull(),
  /** MIME type，例：'image/jpeg', 'image/png', 'image/webp' */
  format:           text('format').notNull(),
  /** 單位：bytes */
  size:             integer('size').notNull(),
  /** 寬度單位：px */
  width:            integer('width').notNull(),
  /** 高度單位：px */
  height:           integer('height').notNull(),
  /** 上傳圖片的使用者 ID */
  uploadedById:     text('uploaded_by_id').notNull(),
  createdAt,
});

export const assetImages = sqliteTable('asset_images', {
  /** 資產 ID */
  assetId: text('asset_id').notNull().references(() => assets.id, cascadeActions),
  /** 圖片 ID */
  imageId: text('image_id').notNull().references(() => images.id, cascadeActions),
  createdAt,
}, (table) => [
  primaryKey({
    columns: [table.assetId, table.imageId],
  }),
]);
