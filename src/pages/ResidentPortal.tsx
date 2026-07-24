import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ChatPanel } from '../components/ChatPanel'
import { ResidentPayPanel } from '../components/ResidentPayPanel'
import { ResidentTicketsPanel } from '../components/ResidentTicketsPanel'
import { LanguageToggle } from '../components/LanguageToggle'
import { SignOutButton } from '../components/SignOutButton'
import { Badge, Button, Card, Field, Flash, Input, PageShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatDisplayDate } from '../lib/formatDate'
import { formatMoney } from '../lib/formatMoney'
import { t } from '../i18n/translations'

type Tab = 'home' | 'pay' | 'tickets' | 'chat' | 'profile'

export function ResidentPortal({ onLogout }: { onLogout: () => void }) {
  const { lang } = useLang()
  const { user, refreshUser } = useAuth()
  const {
    data,
    changePassword,
    getCompany,
    getRentStatus,
    getOrCreateThread,
    getThreadMessages,
    sendChatMessage,
    requestStaffHandoff,
  } = useData()
  const [tab, setTab] = useState<Tab>('home')
  const [flash, setFlash] = useState('')
  const [flashTone, setFlashTone] = useState<'good' | 'bad'>('good')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)

  const apartment = useMemo(
    () => data.apartments.find((a) => a.residentUserId === user?.id),
    [data.apartments, user?.id],
  )
  const building = useMemo(
    () => data.buildings.find((b) => b.id === apartment?.buildingId),
    [data.buildings, apartment?.buildingId],
  )
  const company = user?.companyId ? getCompany(user.companyId) : undefined
  const period = currentRentPeriod()
  const rentStatus = apartment ? getRentStatus(apartment.id, period) : 'unpaid'
  const thread = threadId ? data.chatThreads.find((th) => th.id === threadId) : undefined
  const messages = threadId ? getThreadMessages(threadId) : []

  useEffect(() => {
    if (!user) return
    const existing = data.chatThreads.find((th) => th.residentUserId === user.id)
    if (existing) {
      setThreadId(existing.id)
      return
    }
    const created = getOrCreateThread(user.id, lang)
    if (created) setThreadId(created.id)
  }, [user, lang, data.chatThreads, getOrCreateThread])

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

  return (
    <div className="portal resident-portal">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>{company?.name ?? t(lang, 'brand')}</strong>
          <span className="muted">{user?.name}</span>
        </div>
        <nav className="sidebar-nav">
          <button type="button" className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            {t(lang, 'home')}
          </button>
          <button type="button" className={tab === 'pay' ? 'active' : ''} onClick={() => setTab('pay')}>
            {t(lang, 'pay')}
          </button>
          <button type="button" className={tab === 'tickets' ? 'active' : ''} onClick={() => setTab('tickets')}>
            {t(lang, 'maintenanceTickets')}
          </button>
          <button type="button" className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            {t(lang, 'supportChat')}
          </button>
          <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
            {t(lang, 'profile')}
          </button>
        </nav>
        <div className="sidebar-footer">
          <LanguageToggle />
          <SignOutButton onSignOut={onLogout} />
        </div>
      </aside>

      <main className="portal-main">
        <PageShell
          title={`${t(lang, 'welcomeResident')}, ${user?.name}`}
          actions={<SignOutButton onSignOut={onLogout} />}
        >
          {flash ? <Flash tone={flashTone}>{flash}</Flash> : null}

          {tab === 'home' ? (
            <Card>
              <h3>{t(lang, 'yourApartment')}</h3>
              <dl className="info-list">
                <div>
                  <dt>{t(lang, 'company')}</dt>
                  <dd>{company?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'building')}</dt>
                  <dd>{building?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'unit')}</dt>
                  <dd>{apartment?.label ?? '—'}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'leaseName')}</dt>
                  <dd>{apartment?.leaseName ?? user?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'leaseStart')}</dt>
                  <dd>{formatDisplayDate(apartment?.leaseStart ?? '', lang)}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'leaseEnd')}</dt>
                  <dd>{formatDisplayDate(apartment?.leaseEnd ?? '', lang)}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'leaseFullAmount')}</dt>
                  <dd>{formatMoney(apartment?.leaseAmount ?? 0, lang)}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'email')}</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div>
                  <dt>{t(lang, 'rentStatus')}</dt>
                  <dd>
                    {formatRentPeriod(period, lang)} —{' '}
                    <Badge tone={rentStatus === 'paid' ? 'good' : 'bad'}>
                      {rentStatus === 'paid' ? t(lang, 'paid') : t(lang, 'unpaid')}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>
          ) : null}

          {tab === 'pay' && apartment && building ? (
            <ResidentPayPanel
              apartmentId={apartment.id}
              buildingId={building.id}
              onNotice={(message, tone) => {
                setFlash(message)
                setFlashTone(tone)
              }}
            />
          ) : null}

          {tab === 'tickets' ? (
            <ResidentTicketsPanel
              onNotice={(message, tone = 'good') => {
                setFlash(message)
                setFlashTone(tone)
              }}
            />
          ) : null}

          {tab === 'chat' && user && threadId ? (
            <Card>
              <h3>{t(lang, 'supportChat')}</h3>
              <p className="muted">
                {thread?.status === 'staff' ? t(lang, 'chatWithStaff') : t(lang, 'chatWithAssistant')}
              </p>
              <ChatPanel
                messages={messages}
                viewerRole="resident"
                onSend={(body) => sendChatMessage(threadId, user, body, lang)}
                onRequestStaff={
                  thread?.status === 'ai'
                    ? () => requestStaffHandoff(threadId, lang)
                    : undefined
                }
              />
            </Card>
          ) : null}

          {tab === 'profile' ? (
            <div className="two-col">
              <div className="stack-gap">
                <Card>
                  <h3>{t(lang, 'profile')}</h3>
                  <p className="muted">{t(lang, 'readOnlyProfile')}</p>
                  <dl className="info-list">
                    <div>
                      <dt>{t(lang, 'name')}</dt>
                      <dd>{user?.name}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'email')}</dt>
                      <dd>{user?.email}</dd>
                    </div>
                  </dl>
                </Card>
                <Card>
                  <h3>{t(lang, 'leaseDetails')}</h3>
                  <p className="muted">{t(lang, 'leaseDetailsNote')}</p>
                  <dl className="info-list">
                    <div>
                      <dt>{t(lang, 'company')}</dt>
                      <dd>{company?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'building')}</dt>
                      <dd>{building?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'address')}</dt>
                      <dd>{building?.address ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'unit')}</dt>
                      <dd>{apartment?.label ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'leaseName')}</dt>
                      <dd>{apartment?.leaseName ?? user?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'leaseStart')}</dt>
                      <dd>{formatDisplayDate(apartment?.leaseStart ?? '', lang)}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'leaseEnd')}</dt>
                      <dd>{formatDisplayDate(apartment?.leaseEnd ?? '', lang)}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'leaseFullAmount')}</dt>
                      <dd>{formatMoney(apartment?.leaseAmount ?? 0, lang)}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'residentEmailLabel')}</dt>
                      <dd>{apartment?.residentEmail ?? user?.email ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(lang, 'rentStatus')}</dt>
                      <dd>
                        {formatRentPeriod(period, lang)} —{' '}
                        <Badge tone={rentStatus === 'paid' ? 'good' : 'bad'}>
                          {rentStatus === 'paid' ? t(lang, 'paid') : t(lang, 'unpaid')}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </Card>
              </div>
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
