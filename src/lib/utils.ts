const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function generatePassword(length = 12): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return result
}

export function uid(prefix = ''): string {
  return `${prefix}${crypto.randomUUID()}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function apartmentLabels(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`)
}
