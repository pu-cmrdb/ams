import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  assets: {
    category: r.one.categories({
      from: r.assets.category,
      to: r.categories.name,
    }),
    createdBy: r.one.users({
      from: r.assets.createdById,
      to: r.users.id,
    }),
  },
  categories: {
    assets: r.many.assets(),
  },
}));
