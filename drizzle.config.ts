import { dirname } from 'path';
import { mkdirSync } from 'fs';

import { env } from './src/env';

import type { Config } from 'drizzle-kit';

if (env.NODE_ENV !== 'test') {
  mkdirSync(dirname(env.DATABASE_URL.replace('file:', '')), { recursive: true });
}

export default {
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: 'sqlite',
  schema: './src/server/database/schema.ts',
  tablesFilter: ['ams_*'],
} satisfies Config;
