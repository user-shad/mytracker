import { useMemo, useState, type FormEvent } from 'react'
import { StaffTicketsPanel } from '../components/StaffTicketsPanel'
import { StaffTransfersPanel } from '../components/StaffTransfersPanel'
import { ChatPanel } from '../components/ChatPanel'
import { LanguageToggle } from '../components/LanguageToggle'
import { SignOutButton } from '../components/SignOutButton'
import { Badge, Button, Card, EmptyState, Field, Flash, Input, PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { t } from '../i18n/translations'

type Tab = 'rent' | 'transfers' | 'tickets' | 'chat' | 'profile'

export function StaffPortal({ onLogout }: { onLogout: () => void }) {
  const { lang } = useLang()
  const { user, refreshUser } = useAuth()
  const {
    getCompany,
    getRentStatusRows,
    getCompanyThreads,
    getThreadMessages,
    sendChatMessage,
    assignThread,
    changePassword,
    updateStaff,
    data,
  } = useData()

  const [tab, setTab] = useState<Tab>('rent')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const [flashTone, setFlashTone] = useState<'good' | 'bad' | 'info'>('good')
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '')
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const company = user?.companyId ? getCompany(user.companyId) : undefined
  const period = currentRentPeriod()
  const rentRows = user?.companyId ? getRentStatusRows(user.companyId, period) : []
  const openTicketCount = useMemo(
    () =>
      user?.companyId
        ? data.maintenanceTickets.filter(
            (t) =>
              t.companyId === user.companyId &&
              t.status !== 'closed' &&
              t.status !== 'resolved',
          ).length
        : 0,
    [data.maintenanceTickets, user?.companyId],
  )
  const pendingTransferCount = useMemo(
    () =>
      user?.companyId
        ? data.invoices.filter(
            (i) =>
              i.companyId === user.companyId &&
              i.period === period &&
              i.status === 'pending_review',
          ).length
        : 0,
    [data.invoices, user?.companyId, period],
  )
  const threads = user?.companyId ? getCompanyThreads(user.companyId) : []
  const activeThread = threads.find((th) => th.id === selectedThreadId) ?? threads[0]
  const messages = activeThread ? getThreadMessages(activeThread.id) : []

  const waitingCount = useMemo(
    () => threads.filter((th) => th.status === 'staff' && !th.assignedStaffId).length,
    [threads],
  )

  const threadLabel = (residentUserId: string, apartmentId: string) => {
    const resident = data.users.find((u) => u.id === residentUserId)
    const apt = data.apartments.find((a) => a.id === apartmentId)
    return `${apt?.label ?? '—'} · ${resident?.name ?? t(lang, 'residentLogin')}`
  }

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    const result = updateStaff(user.id, {
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
    })
    if (!result.ok) {
      setFlash(t(lang, 'emailInUse'))
      setFlashTone('bad')
      return
    }
    refreshUser()
    setFlash(t(lang, 'profileUpdated'))
    setFlashTone('good')
  }

  const handlePasswordSave = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassword !== confirmPassword) {
      setFlash(t(lang, 'passwordMismatch'))
      setFlashTone('bad')
      return
    }
    const result = changePassword(user.id, currentPassword, newPassword)
    if (!result.ok) {
      setFlash(t(lang, 'invalidLogin'))
      setFlashTone('bad')
      return
    }
    refreshUser()
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setFlash(t(lang, 'passwordUpdated'))
    setFlashTone('good')
  }

  const rentBadge = (apartmentId: string) => {
    const invoice = data.invoices.find(
      (i) => i.apartmentId === apartmentId && i.period === period,
    )
    if (invoice?.status === 'paid') {
      return (
        <Badge tone="good">{t(lang, 'paid')}</Badge>
      )
    }
    if (invoice?.status === 'pending_review') {
      return (
        <Badge tone="warn">{t(lang, 'invoicePendingReview')}</Badge>
      )
    }
    return (
      <Badge tone="bad">{t(lang, 'unpaid')}</Badge>
    )
  }

  const openThread = (threadId: string) => {
    setSelectedThreadId(threadId)
    if (user) assignThread(threadId, user.id)
  }

  return (
    <div className="portal staff-portal">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>{company?.name ?? t(lang, 'brand')}</strong>
          <span className="muted">{user?.name}</span>
          <Badge tone="warn">{t(lang, 'staffRoleBadge')}</Badge>
        </div>
        <nav className="sidebar-nav">
          <button type="button" className={tab === 'rent' ? 'active' : ''} onClick={() => setTab('rent')}>
            {t(lang, 'rentStatus')}
          </button>
          <button
            type="button"
            className={tab === 'transfers' ? 'active' : ''}
            onClick={() => setTab('transfers')}
          >
            {t(lang, 'staffTransfers')} {pendingTransferCount ? `(${pendingTransferCount})` : ''}
          </button>
          <button
            type="button"
            className={tab === 'tickets' ? 'active' : ''}
            onClick={() => setTab('tickets')}
          >
            {t(lang, 'maintenanceTickets')} {openTicketCount ? `(${openTicketCount})` : ''}
          </button>
          <button type="button" className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            {t(lang, 'supportChat')} {waitingCount ? `(${waitingCount})` : ''}
          </button>
          <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
            {t(lang, 'profile')}
          </button>
        </nav>
        <div className="sidebar-note muted">{t(lang, 'staffIncomeNote')}</div>
        <div className="sidebar-footer">
          <LanguageToggle />
          <SignOutButton onSignOut={onLogout} />
        </div>
      </aside>

      <main className="portal-main">
        <PageShell
          title={`${t(lang, 'welcomeStaff')}, ${user?.name}`}
          actions={<SignOutButton onSignOut={onLogout} />}
        >
          {flash ? <Flash tone={flashTone}>{flash}</Flash> : null}

          {tab === 'rent' ? (
            <>
              <p className="muted">
                {t(lang, 'rentStatusFor')} {formatRentPeriod(period, lang)}
              </p>
              {rentRows.length ? (
                <div className="rent-table-wrap">
                  <table className="rent-table">
                    <thead>
                      <tr>
                        <th>{t(lang, 'building')}</th>
                        <th>{t(lang, 'unit')}</th>
                        <th>{t(lang, 'leaseName')}</th>
                        <th>{t(lang, 'status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentRows.map((row) => (
                        <tr key={row.apartmentId}>
                          <td>{row.buildingName}</td>
                          <td>{row.label}</td>
                          <td>{row.leaseName}</td>
                          <td>{rentBadge(row.apartmentId)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState>{t(lang, 'noOccupiedUnits')}</EmptyState>
              )}
            </>
          ) : null}

          {tab === 'transfers' && user?.companyId ? (
            <StaffTransfersPanel
              companyId={user.companyId}
              onNotice={(message, tone = 'good') => {
                setFlash(message)
                setFlashTone(tone)
              }}
            />
          ) : null}

          {tab === 'tickets' && user?.companyId ? (
            <StaffTicketsPanel
              companyId={user.companyId}
              onNotice={(message, tone = 'good') => {
                setFlash(message)
                setFlashTone(tone)
              }}
            />
          ) : null}

          {tab === 'chat' ? (
            <div className="chat-layout">
              <Card className="chat-thread-list">
                <h3>{t(lang, 'supportQueue')}</h3>
                {threads.length ? (
                  threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className={`thread-item ${activeThread?.id === thread.id ? 'active' : ''}`}
                      onClick={() => openThread(thread.id)}
                    >
                      <strong>{threadLabel(thread.residentUserId, thread.apartmentId)}</strong>
                      <Badge tone={thread.status === 'staff' ? 'warn' : 'neutral'}>
                        {thread.status === 'staff' ? t(lang, 'needsStaff') : t(lang, 'assistantLabel')}
                      </Badge>
                    </button>
                  ))
                ) : (
                  <EmptyState>{t(lang, 'noChats')}</EmptyState>
                )}
              </Card>
              <Card className="chat-thread-view">
                {activeThread && user ? (
                  <>
                    <h3>{t(lang, 'supportChat')}</h3>
                    <ChatPanel
                      messages={messages}
                      viewerRole="staff"
                      onSend={(body) => sendChatMessage(activeThread.id, user, body, lang)}
                    />
                  </>
                ) : (
                  <EmptyState>{t(lang, 'selectChat')}</EmptyState>
                )}
              </Card>
            </div>
          ) : null}

          {tab === 'profile' ? (
            <div className="two-col">
              <Card>
                <h3>{t(lang, 'profile')}</h3>
                <p className="muted">{t(lang, 'staffProfileHint')}</p>
                <form className="stack-form" onSubmit={handleProfileSave}>
                  <Field label={t(lang, 'name')}>
                    <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'email')}>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'phone')}>
                    <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </Field>
                  <Field label={t(lang, 'company')}>
                    <Input value={company?.name ?? ''} disabled />
                  </Field>
                  <Button type="submit">{t(lang, 'save')}</Button>
                </form>
              </Card>
              <Card>
                <h3>{t(lang, 'changePassword')}</h3>
                <form className="stack-form" onSubmit={handlePasswordSave}>
                  <Field label={t(lang, 'currentPassword')}>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'newPassword')}>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'confirmPassword')}>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Button type="submit">{t(lang, 'save')}</Button>
                </form>
              </Card>
            </div>
          ) : null}
        </PageShell>
      </main>
    </div>
  )
}
