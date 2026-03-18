/* eslint-disable perfectionist/sort-objects */
/* eslint @stylistic/key-spacing: ['warn', {align: 'value'}] */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const cascadeActions = {
  onDelete: 'cascade',
  onUpdate: 'cascade',
} as const;

const updatedAt = integer('updated_at', { mode: 'timestamp' })
  .default(sql`(unixepoch())`)
  .$onUpdate(() => /* @__PURE__ */ new Date()).notNull();

const createdAt = integer('created_at', { mode: 'timestamp' })
  .default(sql`(unixepoch())`)
  .notNull();

export const assets = sqliteTable('assets', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  categoryId:  text('category_id').notNull().references(() => categories.id, cascadeActions),
  description: text('description').notNull(),
  createdById: text('created_by_id').notNull(),
  createdAt,
  updatedAt,
});

export const categories = sqliteTable('categories', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull().unique(),
  color:       integer('color').notNull(),
  createdById: text('created_by_id').notNull(),
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
