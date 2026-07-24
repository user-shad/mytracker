import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppData } from '../src/types/index.ts'
import { bootstrapFromRaw, finalizeData } from '../src/lib/dataCore.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const storePath = join(__dirname, 'data', 'store.json')

function ensureStoreDir() {
  const dir = dirname(storePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function loadStore(): AppData {
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

export function saveStore(data: AppData): AppData {
  ensureStoreDir()
  const next = finalizeData(data)
  writeFileSync(storePath, JSON.stringify(next, null, 2), 'utf8')
  return next
}

export function updateStore(updater: (current: AppData) => AppData): AppData {
  const current = loadStore()
  const next = finalizeData(updater(current))
  writeFileSync(storePath, JSON.stringify(next, null, 2), 'utf8')
  return next
}
