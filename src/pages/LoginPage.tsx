import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { Button, Card, Field, Flash, Input, PageShell } from '../components/ui'
import type { UserRole } from '../types'

type LoginRole = Extract<UserRole, 'admin' | 'resident' | 'staff'>

const ROLES: LoginRole[] = ['admin', 'resident', 'staff']

function roleLabel(lang: 'en' | 'ar', role: LoginRole) {
  if (role === 'admin') return t(lang, 'roleAdmin')
  if (role === 'resident') return t(lang, 'roleResident')
  return t(lang, 'roleStaff')
}

export function LoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess: () => void
}) {
  const { lang } = useLang()
  const { login } = useAuth()
  const [role, setRole] = useState<LoginRole>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (login(email, password, role)) {
      onSuccess()
      return
    }
    setError(t(lang, 'invalidLogin'))
  }

  const switchRole = (next: LoginRole) => {
    setRole(next)
    setError('')
  }

  return (
    <PageShell
      title={t(lang, 'login')}
      subtitle={t(lang, 'loginSubtitle')}
      onBack={onBack}
      backLabel={t(lang, 'back')}
      actions={<LanguageToggle />}
    >
      <Card className="form-card">
        <div className="role-tabs" role="tablist" aria-label={t(lang, 'login')}>
          {ROLES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={role === item}
              className={role === item ? 'active' : ''}
              onClick={() => switchRole(item)}
            >
              {roleLabel(lang, item)}
            </button>
          ))}
        </div>
        <form className="stack-form" onSubmit={handleSubmit}>
          {error ? <Flash tone="bad">{error}</Flash> : null}
          <Field label={t(lang, 'email')}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label={t(lang, 'password')}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Button type="submit">{t(lang, 'login')}</Button>
        </form>
      </Card>
    </PageShell>
  )
}
