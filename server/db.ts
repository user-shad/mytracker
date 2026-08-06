import pg from 'pg'
import type { AppData } from '../src/types/index.ts'
import { bootstrapFromRaw, finalizeData } from '../src/lib/dataCore.ts'

const { Pool } = pg

let pool: pg.Pool | null = null

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('render.com')
        ? { rejectUnauthorized: false }
        : undefined,
    })
  }
  return pool
}

export async function initDatabase(): Promise<void> {
  if (!isDatabaseEnabled()) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function loadFromDatabase(): Promise<AppData | null> {
  const result = await getPool().query<{ data: AppData }>(
    'SELECT data FROM app_state WHERE id = 1',
  )
  if (!result.rows.length) return null
  return bootstrapFromRaw(result.rows[0].data)
}

export async function saveToDatabase(data: AppData): Promise<AppData> {
  const next = finalizeData(data)
  await getPool().query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE
     SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(next)],
  )
  return next
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
