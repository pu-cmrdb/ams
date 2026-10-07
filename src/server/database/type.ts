import 'zod/compile';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-orm/zod';

import * as schema from './schema';

export const InventoryPlans = {
  insert: createInsertSchema(schema.inventoryPlans).omit({
    createdAt: true,
    updatedAt: true,
  }),
  select: createSelectSchema(schema.inventoryPlans),
  update: createUpdateSchema(schema.inventoryPlans).omit({
    createdAt: true,
    updatedAt: true,
  }),
};

export const InventoryPlanAssignees = {
  insert: createInsertSchema(schema.inventoryPlanAssignees),
  select: createSelectSchema(schema.inventoryPlanAssignees),
};

export const Assets = {
  insert: createInsertSchema(schema.assets).omit({
    createdAt: true,
    updatedAt: true,
  }),
  select: createSelectSchema(schema.assets),
  update: createUpdateSchema(schema.assets).omit({
    createdAt: true,
    updatedAt: true,
  }),
};

export const AssetRecords = {
  insert: createInsertSchema(schema.assetRecords),
  select: createSelectSchema(schema.assetRecords),
  update: createUpdateSchema(schema.assetRecords),
};

export const Categories = {
  insert: createInsertSchema(schema.categories).omit({
    createdAt: true,
    updatedAt: true,
  }),
  select: createSelectSchema(schema.categories),
  update: createUpdateSchema(schema.categories).omit({
    createdAt: true,
    updatedAt: true,
  }),
};

export const AssetAuthorizedLenders = {
  insert: createInsertSchema(schema.assetAuthorizedLenders),
  select: createSelectSchema(schema.assetAuthorizedLenders),
  update: createUpdateSchema(schema.assetAuthorizedLenders),
};

export const BorrowRecords = {
  insert: createInsertSchema(schema.borrowRecords).omit({
    createdAt: true,
    updatedAt: true,
  }),
  select: createSelectSchema(schema.borrowRecords),
  update: createUpdateSchema(schema.borrowRecords).omit({
    createdAt: true,
    creatorId: true,
    updatedAt: true,
  }),
};
