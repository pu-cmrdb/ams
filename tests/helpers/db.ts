import { Database } from 'bun:sqlite';

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { relations } from '@/server/database/relations';

export type TestDb = ReturnType<typeof createTestDb>['db'];
export type TestSqlite = ReturnType<typeof createTestDb>['client'];

export function createTestDb() {
  const client = new Database();
  const db = drizzle({ client, relations });

  migrate(db, { migrationsFolder: './drizzle' });

  return { client, db };
}
