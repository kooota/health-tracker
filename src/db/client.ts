import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: ReturnType<typeof drizzle> | undefined;
}

function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  if (globalThis.__pgPool) return globalThis.__pgPool;
  const pool = new Pool({ connectionString: url });
  globalThis.__pgPool = pool;
  return pool;
}

export function getDb() {
  if (globalThis.__drizzleDb) return globalThis.__drizzleDb;
  const db = drizzle(getPool());
  globalThis.__drizzleDb = db;
  return db;
}

