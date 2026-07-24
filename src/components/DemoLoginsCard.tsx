import { useLang } from '../context/LangContext'
import { useData } from '../context/DataContext'
import { DEMO_LOGINS, isDemoLoaded } from '../lib/demoData'
import { t } from '../i18n/translations'
import { Card, Flash } from './ui'

export function DemoLoginsCard() {
  const { lang } = useLang()
  const { data } = useData()

  if (!isDemoLoaded(data)) return null

  const rows = [
    { role: t(lang, 'roleAdmin'), ...DEMO_LOGINS.admin },
    { role: t(lang, 'roleStaff'), ...DEMO_LOGINS.staff },
    { role: `${t(lang, 'roleStaff')} 2`, ...DEMO_LOGINS.staff2 },
    { role: `${t(lang, 'roleResident')} (A1)`, ...DEMO_LOGINS.resident },
    { role: `${t(lang, 'roleResident')} (A2)`, ...DEMO_LOGINS.resident2 },
    { role: `${t(lang, 'roleResident')} (B1)`, ...DEMO_LOGINS.resident3 },
  ]

  return (
    <div className="demo-logins-card">
      <Flash tone="info">
        <strong>{t(lang, 'demoLoadedTitle')}</strong>
        <p className="muted">{t(lang, 'demoLoadedDesc')}</p>
        <div className="demo-logins-grid">
          {rows.map((row) => (
            <Card key={row.email} className="demo-login-row">
              <span className="demo-login-role">{row.role}</span>
              <code>{row.email}</code>
              <code>{row.password}</code>
            </Card>
          ))}
        </div>
      </Flash>
    </div>
  )
}
