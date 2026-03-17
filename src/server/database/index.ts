import { createClient } from '@libsql/client';
import { dirname } from 'path';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'fs';

import { env } from '@/env';

import { relations } from './relations';

import type { Client } from '@libsql/client';

mkdirSync(dirname(env.DATABASE_URL.replace('file:', '')), { recursive: true });

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

export const client = globalForDb.client ?? createClient({ url: env.DATABASE_URL });
if (env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle({ client, relations });

export * as schema from './schema';
