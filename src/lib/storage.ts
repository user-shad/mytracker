import { isCloudEnabled, PLATFORM } from '../config/platform'
import type { AppData } from '../types'
import { bootstrapFromRaw, emptyData, finalizeData, seedTechnician } from './dataCore'
import { fetchCloudData, saveCloudData } from './cloudApi'

export function loadDataLocal(): AppData {
  try {
    const raw = localStorage.getItem(PLATFORM.storageKey)
    if (!raw) {
      const data = bootstrapFromRaw(null)
      saveDataLocal(data)
      return data
    }
    const parsed = bootstrapFromRaw(JSON.parse(raw) as Partial<AppData>)
    saveDataLocal(parsed)
    return parsed
  } catch {
    const data = bootstrapFromRaw(null)
    saveDataLocal(data)
    return data
  }
}

export async function loadData(): Promise<AppData> {
  if (!isCloudEnabled()) return loadDataLocal()

  try {
    const remote = await fetchCloudData()
    const data = finalizeData(remote)
    saveDataLocal(data)
    return data
  } catch {
    return loadDataLocal()
  }
}

export function saveDataLocal(data: AppData): void {
  localStorage.setItem(PLATFORM.storageKey, JSON.stringify(data))
}

export async function saveData(data: AppData): Promise<void> {
  saveDataLocal(data)
  if (isCloudEnabled()) {
    await saveCloudData(data)
  }
}

export function resetDemoData(): AppData {
  const data = emptyData()
  data.users.push(seedTechnician())
  data.initialized = true
  saveDataLocal(data)
  return data
}
