import { useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { Button, Card, Field, Flash, Input, PageShell } from '../components/ui'

export function CompanySignupPage({ onBack }: { onBack: () => void }) {
  const { lang } = useLang()
  const { submitRegistration } = useData()
  const [companyName, setCompanyName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = submitRegistration({ companyName, adminName, adminEmail, phone })
    if (!result.ok) {
      setError(result.error === 'emailInUse' ? t(lang, 'emailInUse') : t(lang, 'required'))
      return
    }
    setDone(true)
    setError('')
  }

  if (done) {
    return (
      <PageShell
        title={t(lang, 'pendingApproval')}
        subtitle={t(lang, 'pendingApprovalDesc')}
        onBack={onBack}
        backLabel={t(lang, 'back')}
        actions={<LanguageToggle />}
      >
        <Flash tone="good">{t(lang, 'pendingApprovalDesc')}</Flash>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={t(lang, 'signupTitle')}
      subtitle={t(lang, 'signupSubtitle')}
      onBack={onBack}
      backLabel={t(lang, 'back')}
      actions={<LanguageToggle />}
    >
      <Card className="form-card">
        <form className="stack-form" onSubmit={handleSubmit}>
          {error ? <Flash tone="bad">{error}</Flash> : null}
          <Field label={t(lang, 'companyName')}>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </Field>
          <Field label={t(lang, 'adminName')}>
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
          </Field>
          <Field label={t(lang, 'email')}>
            <Input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </Field>
          <Field label={`${t(lang, 'phone')} (${t(lang, 'optional')})`}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Button type="submit">{t(lang, 'submit')}</Button>
        </form>
      </Card>
    </PageShell>
  )
}
