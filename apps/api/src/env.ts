import type { Db } from './db/client';

export type AppEnv = {
  Bindings: { APP_ACCESS_PASSWORD?: string };
  Variables: { db: Db };
};