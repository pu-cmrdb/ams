import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype';

import * as schema from './schema';

export const InventoryPlans = {
  insert: createInsertSchema(schema.inventoryPlans).omit('createdAt', 'updatedAt'),
  select: createSelectSchema(schema.inventoryPlans),
  update: createUpdateSchema(schema.inventoryPlans).omit('createdAt', 'updatedAt'),
};

export const InventoryPlanAssignees = {
  insert: createInsertSchema(schema.inventoryPlanAssignees),
  select: createSelectSchema(schema.inventoryPlanAssignees),
};

export const Assets = {
  insert: createInsertSchema(schema.assets).omit('createdAt', 'updatedAt'),
  select: createSelectSchema(schema.assets),
  update: createUpdateSchema(schema.assets).omit('createdAt', 'updatedAt'),
};

export const AssetRecords = {
  insert: createInsertSchema(schema.assetRecords),
  select: createSelectSchema(schema.assetRecords),
  update: createUpdateSchema(schema.assetRecords),
};

export const Categories = {
  insert: createInsertSchema(schema.categories).omit('createdAt', 'updatedAt'),
  select: createSelectSchema(schema.categories),
  update: createUpdateSchema(schema.categories).omit('createdAt', 'updatedAt'),
};

export const AssetAuthorizedLenders = {
  insert: createInsertSchema(schema.assetAuthorizedLenders),
  select: createSelectSchema(schema.assetAuthorizedLenders),
  update: createUpdateSchema(schema.assetAuthorizedLenders),
};

export const BorrowRecords = {
  insert: createInsertSchema(schema.borrowRecords).omit('createdAt', 'updatedAt'),
  select: createSelectSchema(schema.borrowRecords),
  update: createUpdateSchema(schema.borrowRecords).omit('createdAt', 'creatorId', 'updatedAt'),
};
