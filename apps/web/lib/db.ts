import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

let cached: Db | undefined;

export function getDb(): Db {
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
