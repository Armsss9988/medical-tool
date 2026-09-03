import fs from 'fs';
import path from 'path';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

function loadEnvIfMissing() {
  if (process.env.DATABASE_URL) return;
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env')
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const envContent = fs.readFileSync(p, 'utf8');
        for (const line of envContent.split('\n')) {
          const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
          if (m && m[1] && !process.env[m[1]]) {
            process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
          }
        }
        if (process.env.DATABASE_URL) break;
      }
    } catch {
      // Ignore filesystem errors in restricted environments
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _drizzleDb: Db | undefined;
  // eslint-disable-next-line no-var
  var _postgresClient: ReturnType<typeof postgres> | undefined;
}

export function getDb(): Db {
  loadEnvIfMissing();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!globalThis._drizzleDb) {
    const queryClient = postgres(url, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 15,
      prepare: false,
      ssl: { rejectUnauthorized: false }
    });
    globalThis._postgresClient = queryClient;
    globalThis._drizzleDb = drizzle(queryClient, { schema });
  }
  return globalThis._drizzleDb;
}

export function getDbSafe(): Db | null {
  try {
    loadEnvIfMissing();
    if (!process.env.DATABASE_URL) return null;
    return getDb();
  } catch {
    return null;
  }
}
