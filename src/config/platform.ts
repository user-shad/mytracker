export { PLATFORM } from './constants'

export const CLOUD = {
  enabled: import.meta.env.VITE_USE_CLOUD === 'true' || import.meta.env.PROD,
  apiBase: import.meta.env.VITE_API_URL || '/api',
} as const

export function isCloudEnabled(): boolean {
  return CLOUD.enabled
}
