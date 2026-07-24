import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { useData } from './DataContext'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string, role?: User['role']) => boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authenticate, data } = useData()
  const [user, setUser] = useState<User | null>(null)

  const login = (email: string, password: string, role?: User['role']) => {
    const found = authenticate(email, password, role)
    if (!found) return false
    setUser(found)
    return true
  }

  const logout = () => setUser(null)

  const refreshUser = () => {
    if (!user) return
    const updated = data.users.find((u) => u.id === user.id)
    if (updated) setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useAuthOptional() {
  return useContext(AuthContext)
}
