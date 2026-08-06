import bcrypt from 'bcryptjs'

export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10)
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (isPasswordHashed(stored)) return bcrypt.compareSync(plain, stored)
  return plain === stored
}

export function needsPasswordRehash(stored: string): boolean {
  return !isPasswordHashed(stored)
}
