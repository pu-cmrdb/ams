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
