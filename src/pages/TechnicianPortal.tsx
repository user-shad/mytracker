import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { SignOutButton } from '../components/SignOutButton'
import { SimulatedEmailList } from '../components/SimulatedEmailList'
import { CloudStatusCard } from '../components/CloudStatusCard'
import { TechnicianAdminCard } from '../components/TechnicianAdminCard'
import { TechnicianTicketsPanel } from '../components/TechnicianTicketsPanel'
import {
  Button,
  Card,
  EmptyState,
  Flash,
  PageShell,
  StatCard,
} from '../components/ui'

type Tab = 'pending' | 'admins' | 'tickets' | 'emails'

export function TechnicianPortal({ onLogout }: { onLogout: () => void }) {
  const { lang } = useLang()
  const { user } = useAuth()
  const { data, approveRegistration, rejectRegistration } = useData()
  const [tab, setTab] = useState<Tab>('pending')
  const [message, setMessage] = useState('')
  const [lastPassword, setLastPassword] = useState('')

  const pending = useMemo(
    () => data.pendingRegistrations.filter((r) => r.status === 'pending'),
    [data.pendingRegistrations],
  )

  const openTicketCount = useMemo(
    () =>
      data.maintenanceTickets.filter(
        (ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved',
      ).length,
    [data.maintenanceTickets],
  )

  const handleApprove = (id: string) => {
    const result = approveRegistration(id)
    if (result.ok) {
      setMessage(t(lang, 'approvalSent'))
      setLastPassword(result.password ?? '')
    }
  }

  const handleReject = (id: string) => {
    if (!confirm(t(lang, 'rejectConfirm'))) return
    rejectRegistration(id)
    setMessage(t(lang, 'rejectionSent'))
    setLastPassword('')
  }

  return (
    <div className="portal technician-portal">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>{t(lang, 'brand')}</strong>
          <span className="muted">{user?.name}</span>
        </div>
        <nav className="sidebar-nav">
          <button type="button" className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>
            {t(lang, 'pendingRegistrations')} ({pending.length})
          </button>
          <button type="button" className={tab === 'admins' ? 'active' : ''} onClick={() => setTab('admins')}>
            {t(lang, 'technicianAdmins')} ({data.companies.length})
          </button>
          <button type="button" className={tab === 'tickets' ? 'active' : ''} onClick={() => setTab('tickets')}>
            {t(lang, 'technicianTickets')} ({openTicketCount})
          </button>
          <button type="button" className={tab === 'emails' ? 'active' : ''} onClick={() => setTab('emails')}>
            {t(lang, 'simulatedEmails')}
          </button>
        </nav>
        <div className="sidebar-footer">
          <LanguageToggle />
          <SignOutButton onSignOut={onLogout} />
        </div>
      </aside>

      <main className="portal-main">
        <PageShell
          title={t(lang, 'dashboard')}
          subtitle={t(lang, 'phaseNote')}
          actions={<SignOutButton onSignOut={onLogout} />}
        >
          <div className="stat-row">
            <StatCard label={t(lang, 'pendingCount')} value={pending.length} />
            <StatCard label={t(lang, 'totalCompanies')} value={data.companies.length} />
            <StatCard label={t(lang, 'totalBuildings')} value={data.buildings.length} />
          </div>

          {message ? <Flash tone="good">{message}</Flash> : null}
          <CloudStatusCard />
          {lastPassword ? (
            <Flash tone="info">
              {t(lang, 'generatedPassword')}: <code>{lastPassword}</code>
            </Flash>
          ) : null}

          {tab === 'pending' ? (
            pending.length ? (
              <div className="table-list">
                {pending.map((reg) => (
                  <Card key={reg.id} className="row-card">
                    <div>
                      <h3>{reg.companyName}</h3>
                      <p className="muted">
                        {reg.adminName} · {reg.adminEmail}
                      </p>
                      <p className="muted">{new Date(reg.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="row-actions">
                      <Button onClick={() => handleApprove(reg.id)}>{t(lang, 'approve')}</Button>
                      <Button variant="danger" onClick={() => handleReject(reg.id)}>
                        {t(lang, 'reject')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState>{t(lang, 'noPending')}</EmptyState>
            )
          ) : null}

          {tab === 'admins' ? (
            data.companies.length ? (
              <div className="technician-admin-grid">
                {data.companies.map((company) => (
                  <TechnicianAdminCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <EmptyState>{t(lang, 'noCompanies')}</EmptyState>
            )
          ) : null}

          {tab === 'tickets' ? (
            <TechnicianTicketsPanel
              onNotice={(msg) => {
                setMessage(msg)
                setLastPassword('')
              }}
            />
          ) : null}

          {tab === 'emails' ? <SimulatedEmailList emails={data.simulatedEmails} /> : null}
        </PageShell>
      </main>
    </div>
  )
}
