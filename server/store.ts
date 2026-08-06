import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppData } from '../src/types/index.ts'
import { bootstrapFromRaw, finalizeData } from '../src/lib/dataCore.ts'
import {
  initDatabase,
  isDatabaseEnabled,
  loadFromDatabase,
  saveToDatabase,
} from './db.ts'
import { migratePasswords } from './migratePasswords.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const storePath = join(__dirname, 'data', 'store.json')

let cache: AppData | null = null
let saveQueue: Promise<void> = Promise.resolve()

function ensureStoreDir() {
  const dir = dirname(storePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function loadFromJson(): AppData {
  ensureStoreDir()
  if (!existsSync(storePath)) {
    const data = bootstrapFromRaw(null)
    writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8')
    return data
  }

  try {
    const raw = JSON.parse(readFileSync(storePath, 'utf8')) as Partial<AppData>
    const data = bootstrapFromRaw(raw)
    writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8')
    return data
  } catch {
    const data = bootstrapFromRaw(null)
    writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8')
    return data
  }
}

function saveToJson(data: AppData): AppData {
  ensureStoreDir()
  const next = finalizeData(data)
  writeFileSync(storePath, JSON.stringify(next, null, 2), 'utf8')
  return next
}

function queuePersist(data: AppData): AppData {
  const next = finalizeData(data)
  cache = next

  if (isDatabaseEnabled()) {
    saveQueue = saveQueue
      .then(() => saveToDatabase(next))
      .catch((error) => {
        console.error('Database save failed:', error)
      })
  } else {
    saveToJson(next)
  }

  return next
}

export async function initStore(): Promise<AppData> {
  if (isDatabaseEnabled()) {
    await initDatabase()
    const fromDatabase = await loadFromDatabase()
    if (fromDatabase) {
      cache = migratePasswords(fromDatabase)
      if (cache !== fromDatabase) queuePersist(cache)
      return cache
    }

    const fromJson = migratePasswords(loadFromJson())
    cache = await saveToDatabase(fromJson)
    return cache
  }

  cache = migratePasswords(loadFromJson())
  return cache
}

export function loadStore(): AppData {
  if (!cache) throw new Error('Store not initialized. Call initStore() first.')
  return cache
}

export function saveStore(data: AppData): AppData {
  return queuePersist(migratePasswords(data))
}

export function updateStore(updater: (current: AppData) => AppData): AppData {
  return queuePersist(updater(loadStore()))
}

export async function flushStore(): Promise<void> {
  await saveQueue
}

export function storeBackend(): 'postgres' | 'json' {
  return isDatabaseEnabled() ? 'postgres' : 'json'
}
