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
  category:    text('category').notNull().references(() => categories.name, cascadeActions),
  description: text('description').notNull(),
  createdById: text('created_by_id').notNull().references(() => users.id, cascadeActions),
  createdAt,
  updatedAt,
});

export const categories = sqliteTable('categories', {
  name:        text('name').primaryKey().unique(),
  color:       integer('color').notNull(),
  createdById: text('created_by_id').notNull().references(() => users.id, cascadeActions),
  createdAt,
  updatedAt,
});

export const tasks = sqliteTable('tasks', {
  id:           text('id'),
  name:         text('name').notNull(),
  description:  text('description').notNull(),
  createdById:  text('created_by_id').notNull().references(() => users.id, cascadeActions),
  assignedToId: text('assigned_to_id').notNull().references(() => users.id, cascadeActions),
  dueAt:        integer('due_at', { mode: 'timestamp' }).notNull(),
  completedAt:  integer('completed_at', { mode: 'timestamp' }),
  createdAt,
  updatedAt,
});

export const users = sqliteTable('users', {
  id:        text('id').primaryKey().unique(),
  name:      text('name').notNull(),
  imageHash: text('image_hash').notNull(),
});
