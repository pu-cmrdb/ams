import { Database } from 'bun:sqlite';

import { dirname } from 'path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'fs';

import { env } from '@/env';

import { relations } from './relations';

const dbPath = env.DATABASE_URL.replace(/^file:/, '');

if (env.NODE_ENV !== 'test') {
  mkdirSync(dirname(dbPath), { recursive: true });
}

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Database | undefined;
};

export const client = globalForDb.client ?? new Database(dbPath);
if (env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle({ client, relations });

export * as schema from './schema';
