import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { Button, Card, Field, Flash, Input, PageShell } from '../components/ui'

export function TechnicianLoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess: () => void
}) {
  const { lang } = useLang()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (login(email, password, 'technician')) {
      onSuccess()
      return
    }
    setError(t(lang, 'invalidLogin'))
  }

  return (
    <PageShell
      title={t(lang, 'technicianLogin')}
      onBack={onBack}
      backLabel={t(lang, 'back')}
      actions={<LanguageToggle />}
    >
      <Card className="form-card">
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
