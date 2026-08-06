import type { AppData } from '../src/types/index.ts'
import { hashPassword, needsPasswordRehash } from '../src/lib/password.ts'

export function migratePasswords(data: AppData): AppData {
  let changed = false
  const users = data.users.map((user) => {
    if (!needsPasswordRehash(user.password)) return user
    changed = true
    return { ...user, password: hashPassword(user.password) }
  })
  return changed ? { ...data, users } : data
}
