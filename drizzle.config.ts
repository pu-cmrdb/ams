import { env } from './src/env';

import type { Config } from 'drizzle-kit';

export default {
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: 'sqlite',
  schema: './src/server/db/schema.ts',
  tablesFilter: ['ams_*'],
} satisfies Config;
