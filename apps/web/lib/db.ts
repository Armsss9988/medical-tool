import fs from 'fs';
import path from 'path';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

let cached: Db | undefined;

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

export function getDb(): Db {
  loadEnvIfMissing();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!cached) {
    const queryClient = postgres(url, { max: 1, prepare: false });
    cached = drizzle(queryClient, { schema });
  }
  return cached;
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
