import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import type { SimulatedEmail } from '../types'
import { Card, EmptyState } from './ui'

export function SimulatedEmailList({ emails }: { emails: SimulatedEmail[] }) {
  const { lang } = useLang()

  if (!emails.length) {
    return <EmptyState>{t(lang, 'noEmails')}</EmptyState>
  }

  return (
    <div className="email-list">
      {emails.map((mail) => (
        <Card key={mail.id} className="email-card">
          <div className="email-meta">
            <strong>{mail.subject}</strong>
            <span className="muted">{new Date(mail.createdAt).toLocaleString()}</span>
          </div>
          <p className="email-to">
            To: <code>{mail.to}</code>
          </p>
          <pre className="email-body">{mail.body}</pre>
        </Card>
      ))}
    </div>
  )
}
