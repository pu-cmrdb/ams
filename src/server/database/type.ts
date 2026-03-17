import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype';

import * as schema from './schema';

export const InventoryPlans = {
  insert: createInsertSchema(schema.inventoryPlans).omit('createdAt', 'updatedAt', 'assignedToIds')
    .and({ /** 盤點人員 ID 陣列 */ assignedToIds: 'string[]' }),
  select: createSelectSchema(schema.inventoryPlans).omit('assignedToIds')
    .and({ /** 盤點人員 ID 陣列 */ assignedToIds: 'string[]' }),
  update: createUpdateSchema(schema.inventoryPlans).omit('createdAt', 'updatedAt', 'assignedToIds')
    .and({ /** 盤點人員 ID 陣列 */ 'assignedToIds?': 'string[]' }),
};
