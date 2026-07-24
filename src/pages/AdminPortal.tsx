import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatDisplayDate } from '../lib/formatDate'
import { formatMoney } from '../lib/formatMoney'
import { AdminPaymentsPanel } from '../components/AdminPaymentsPanel'
import { AdminTicketsPanel } from '../components/AdminTicketsPanel'
import { LanguageToggle } from '../components/LanguageToggle'
import { SignOutButton } from '../components/SignOutButton'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Flash,
  Input,
  PageShell,
  StatCard,
} from '../components/ui'

type Tab = 'overview' | 'profile' | 'buildings' | 'payments' | 'tickets' | 'staff'

export function AdminPortal({ onLogout }: { onLogout: () => void }) {
  const { lang } = useLang()
  const { user, refreshUser } = useAuth()
  const {
    getCompany,
    getBuildingsForCompany,
    getApartmentsForBuilding,
    addBuilding,
    updateBuilding,
    removeBuilding,
    updateAdminProfile,
    changePassword,
    assignResident,
    updateApartmentLease,
    removeResident,
    createStaff,
    removeStaff,
    getStaffForCompany,
    setRentStatus,
    getRentStatus,
  } = useData()

  const [tab, setTab] = useState<Tab>('overview')
  const [flash, setFlash] = useState('')
  const [flashTone, setFlashTone] = useState<'good' | 'bad' | 'info'>('good')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const company = user?.companyId ? getCompany(user.companyId) : undefined
  const buildings = user?.companyId ? getBuildingsForCompany(user.companyId) : []
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) ?? buildings[0]
  const apartments = selectedBuilding ? getApartmentsForBuilding(selectedBuilding.id) : []

  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '')
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [buildingName, setBuildingName] = useState('')
  const [buildingAddress, setBuildingAddress] = useState('')
  const [unitPrefix, setUnitPrefix] = useState('A')
  const [apartmentCount, setApartmentCount] = useState(12)
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null)

  const [assignAptId, setAssignAptId] = useState<string | null>(null)
  const [editLeaseAptId, setEditLeaseAptId] = useState<string | null>(null)
  const [leaseName, setLeaseName] = useState('')
  const [residentEmail, setResidentEmail] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [leaseAmount, setLeaseAmount] = useState('')

  const [staffName, setStaffName] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPhone, setStaffPhone] = useState('')

  const staffMembers = user?.companyId ? getStaffForCompany(user.companyId) : []
  const rentPeriod = currentRentPeriod()

  const totalApartments = useMemo(
    () => buildings.reduce((sum, b) => sum + b.apartmentCount, 0),
    [buildings],
  )

  const showFlash = (msg: string, tone: 'good' | 'bad' | 'info' = 'good') => {
    setFlash(msg)
    setFlashTone(tone)
  }

  const resetBuildingForm = () => {
    setBuildingName('')
    setBuildingAddress('')
    setUnitPrefix('A')
    setApartmentCount(12)
    setEditingBuildingId(null)
  }

  const startEditBuilding = (id: string) => {
    const b = buildings.find((x) => x.id === id)
    if (!b) return
    setEditingBuildingId(id)
    setBuildingName(b.name)
    setBuildingAddress(b.address)
    setUnitPrefix(b.unitPrefix)
    setApartmentCount(b.apartmentCount)
    setSelectedBuildingId(id)
    setTab('buildings')
  }

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    const result = updateAdminProfile(user.id, {
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
    })
    if (!result.ok) {
      showFlash(t(lang, 'emailInUse'), 'bad')
      return
    }
    refreshUser()
    showFlash(t(lang, 'profileUpdated'))
  }

  const handlePasswordSave = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassword !== confirmPassword) {
      showFlash(t(lang, 'passwordMismatch'), 'bad')
      return
    }
    const result = changePassword(user.id, currentPassword, newPassword)
    if (!result.ok) {
      showFlash(t(lang, 'invalidLogin'), 'bad')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showFlash(t(lang, 'passwordUpdated'))
  }

  const handleBuildingSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!user?.companyId) return
    if (editingBuildingId) {
      updateBuilding(editingBuildingId, {
        name: buildingName,
        address: buildingAddress,
        unitPrefix,
        apartmentCount,
      })
      showFlash(t(lang, 'buildingUpdated'))
    } else {
      const created = addBuilding(user.companyId, {
        name: buildingName,
        address: buildingAddress,
        unitPrefix,
        apartmentCount,
      })
      if (created) setSelectedBuildingId(created.id)
      showFlash(t(lang, 'buildingAdded'))
    }
    resetBuildingForm()
  }

  const handleAssignResident = (e: FormEvent) => {
    e.preventDefault()
    if (!assignAptId) return
    const result = assignResident(assignAptId, {
      leaseName,
      email: residentEmail,
      leaseStart,
      leaseEnd,
      leaseAmount: Number(leaseAmount),
    })
    if (!result.ok) {
      showFlash(
        result.error === 'emailInUse'
          ? t(lang, 'emailInUse')
          : result.error === 'leaseDateOrder'
            ? t(lang, 'leaseDateOrder')
            : t(lang, 'required'),
        'bad',
      )
      return
    }
    setGeneratedPassword(result.password ?? '')
    setAssignAptId(null)
    setLeaseName('')
    setResidentEmail('')
    setLeaseStart('')
    setLeaseEnd('')
    setLeaseAmount('')
    showFlash(t(lang, 'residentAssigned'))
  }

  const openEditLease = (aptId: string) => {
    const apt = apartments.find((a) => a.id === aptId)
    if (!apt) return
    setEditLeaseAptId(aptId)
    setLeaseName(apt.leaseName)
    setLeaseStart(apt.leaseStart)
    setLeaseEnd(apt.leaseEnd)
    setLeaseAmount(apt.leaseAmount > 0 ? String(apt.leaseAmount) : '')
  }

  const handleEditLease = (e: FormEvent) => {
    e.preventDefault()
    if (!editLeaseAptId) return
    const result = updateApartmentLease(editLeaseAptId, {
      leaseName,
      leaseStart,
      leaseEnd,
      leaseAmount: Number(leaseAmount),
    })
    if (!result.ok) {
      showFlash(
        result.error === 'leaseDateOrder' ? t(lang, 'leaseDateOrder') : t(lang, 'required'),
        'bad',
      )
      return
    }
    setEditLeaseAptId(null)
    setLeaseName('')
    setLeaseStart('')
    setLeaseEnd('')
    setLeaseAmount('')
    showFlash(t(lang, 'leaseUpdated'))
  }

  const resetAssignForm = () => {
    setAssignAptId(null)
    setLeaseName('')
    setResidentEmail('')
    setLeaseStart('')
    setLeaseEnd('')
    setLeaseAmount('')
  }

  const handleCreateStaff = (e: FormEvent) => {
    e.preventDefault()
    if (!user?.companyId) return
    const result = createStaff(user.companyId, {
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
    })
    if (!result.ok) {
      showFlash(result.error === 'emailInUse' ? t(lang, 'emailInUse') : t(lang, 'required'), 'bad')
      return
    }
    setGeneratedPassword(result.password ?? '')
    setStaffName('')
    setStaffEmail('')
    setStaffPhone('')
    showFlash(t(lang, 'staffCreated'))
  }

  const toggleRent = (apartmentId: string) => {
    const current = getRentStatus(apartmentId, rentPeriod)
    setRentStatus(apartmentId, rentPeriod, current === 'paid' ? 'unpaid' : 'paid')
    showFlash(t(lang, 'rentStatusUpdated'))
  }

  return (
    <div className="portal admin-portal">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>{company?.name ?? t(lang, 'brand')}</strong>
          <span className="muted">{user?.name}</span>
        </div>
        <nav className="sidebar-nav">
          <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            {t(lang, 'overview')}
          </button>
          <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
            {t(lang, 'profile')}
          </button>
          <button type="button" className={tab === 'buildings' ? 'active' : ''} onClick={() => setTab('buildings')}>
            {t(lang, 'buildings')}
          </button>
          <button type="button" className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>
            {t(lang, 'payments')}
          </button>
          <button type="button" className={tab === 'tickets' ? 'active' : ''} onClick={() => setTab('tickets')}>
            {t(lang, 'maintenanceTickets')}
          </button>
          <button type="button" className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>
            {t(lang, 'staff')}
          </button>
        </nav>
        <div className="sidebar-footer">
          <LanguageToggle />
          <SignOutButton onSignOut={onLogout} />
        </div>
      </aside>

      <main className="portal-main">
        <PageShell
          title={`${t(lang, 'welcomeAdmin')}, ${user?.name}`}
          subtitle={company?.name}
          actions={<SignOutButton onSignOut={onLogout} />}
        >
          {flash ? <Flash tone={flashTone}>{flash}</Flash> : null}
          {generatedPassword ? (
            <Flash tone="info">
              {t(lang, 'generatedPassword')}: <code>{generatedPassword}</code>
            </Flash>
          ) : null}

          {tab === 'overview' ? (
            <>
              <div className="stat-row">
                <StatCard label={t(lang, 'totalBuildings')} value={buildings.length} />
                <StatCard label={t(lang, 'totalApartments')} value={totalApartments} />
              </div>
              <Card>
                <p className="muted">{t(lang, 'paymentNote')}</p>
                <p className="muted">{t(lang, 'phaseNote')}</p>
              </Card>
            </>
          ) : null}

          {tab === 'profile' ? (
            <div className="two-col">
              <Card>
                <h3>{t(lang, 'profile')}</h3>
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

          {tab === 'buildings' ? (
            <div className="two-col">
              <Card>
                <h3>{editingBuildingId ? t(lang, 'edit') : t(lang, 'addBuilding')}</h3>
                <form className="stack-form" onSubmit={handleBuildingSubmit}>
                  <Field label={t(lang, 'buildingName')}>
                    <Input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'address')}>
                    <Input value={buildingAddress} onChange={(e) => setBuildingAddress(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'unitPrefix')}>
                    <Input value={unitPrefix} onChange={(e) => setUnitPrefix(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'apartmentCount')}>
                    <Input
                      type="number"
                      min={1}
                      value={apartmentCount}
                      onChange={(e) => setApartmentCount(Number(e.target.value))}
                      required
                    />
                  </Field>
                  <div className="inline-actions">
                    <Button type="submit">{editingBuildingId ? t(lang, 'save') : t(lang, 'add')}</Button>
                    {editingBuildingId ? (
                      <Button type="button" variant="ghost" onClick={resetBuildingForm}>
                        {t(lang, 'cancel')}
                      </Button>
                    ) : null}
                  </div>
                </form>
              </Card>

              <div className="stack-gap">
                {buildings.length ? (
                  buildings.map((b) => (
                    <Card key={b.id} className="row-card">
                      <div>
                        <h3>{b.name}</h3>
                        <p className="muted">{b.address}</p>
                        <p>
                          {b.apartmentCount} {t(lang, 'apartments').toLowerCase()} ({b.unitPrefix}1–
                          {b.unitPrefix}
                          {b.apartmentCount})
                        </p>
                      </div>
                      <div className="row-actions">
                        <Button variant="soft" onClick={() => { setSelectedBuildingId(b.id); startEditBuilding(b.id) }}>
                          {t(lang, 'edit')}
                        </Button>
                        <Button
                          variant="soft"
                          onClick={() => setSelectedBuildingId(b.id)}
                        >
                          {t(lang, 'apartments')}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm(t(lang, 'removeBuildingConfirm'))) {
                              removeBuilding(b.id)
                              showFlash(t(lang, 'buildingRemoved'))
                            }
                          }}
                        >
                          {t(lang, 'remove')}
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <EmptyState>{t(lang, 'noCompanies')}</EmptyState>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'buildings' && selectedBuilding ? (
            <section className="apartment-section">
              <h2>
                {t(lang, 'apartments')} — {selectedBuilding.name}
              </h2>
              <div className="apartment-grid">
                {apartments.map((apt) => (
                  <Card key={apt.id} className="apt-card">
                    <div className="apt-head">
                      <strong>{apt.label}</strong>
                      {apt.residentUserId ? <Badge tone="good">{apt.leaseName}</Badge> : <Badge>{t(lang, 'emptyApartments')}</Badge>}
                    </div>
                    {apt.residentEmail ? <p className="muted">{apt.residentEmail}</p> : null}
                    {apt.residentUserId ? (
                      <p className="muted">
                        {t(lang, 'leaseStart')}: {formatDisplayDate(apt.leaseStart, lang)} · {t(lang, 'leaseEnd')}:{' '}
                        {formatDisplayDate(apt.leaseEnd, lang)} · {t(lang, 'leaseFullAmount')}:{' '}
                        {formatMoney(apt.leaseAmount, lang)}
                      </p>
                    ) : null}
                    {apt.residentUserId ? (
                      <p>
                        {t(lang, 'rentStatusFor')} {formatRentPeriod(rentPeriod, lang)}:{' '}
                        <Badge tone={getRentStatus(apt.id, rentPeriod) === 'paid' ? 'good' : 'bad'}>
                          {getRentStatus(apt.id, rentPeriod) === 'paid' ? t(lang, 'paid') : t(lang, 'unpaid')}
                        </Badge>
                      </p>
                    ) : null}
                    <div className="row-actions">
                      {apt.residentUserId ? (
                        <>
                          <Button variant="soft" onClick={() => openEditLease(apt.id)}>
                            {t(lang, 'editLease')}
                          </Button>
                          <Button variant="soft" onClick={() => toggleRent(apt.id)}>
                            {t(lang, 'toggleRent')}
                          </Button>
                          <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm(t(lang, 'removeResidentConfirm'))) {
                              removeResident(apt.id)
                              showFlash(t(lang, 'residentRemoved'))
                            }
                          }}
                        >
                          {t(lang, 'remove')}
                        </Button>
                        </>
                      ) : (
                        <Button variant="soft" onClick={() => setAssignAptId(apt.id)}>
                          {t(lang, 'assignResident')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'payments' && user?.companyId ? (
            <AdminPaymentsPanel
              buildings={buildings}
              onNotice={(message, tone = 'good') => showFlash(message, tone)}
            />
          ) : null}

          {tab === 'tickets' && user?.companyId ? (
            <AdminTicketsPanel
              buildings={buildings}
              onNotice={(message, tone = 'good') => showFlash(message, tone)}
            />
          ) : null}

          {tab === 'staff' ? (
            <div className="two-col">
              <Card>
                <h3>{t(lang, 'addStaff')}</h3>
                <p className="muted">{t(lang, 'addStaffHint')}</p>
                <form className="stack-form" onSubmit={handleCreateStaff}>
                  <Field label={t(lang, 'name')}>
                    <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'email')}>
                    <Input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={`${t(lang, 'phone')} (${t(lang, 'optional')})`}>
                    <Input value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
                  </Field>
                  <Button type="submit">{t(lang, 'addStaff')}</Button>
                </form>
              </Card>
              <div className="stack-gap">
                {staffMembers.length ? (
                  staffMembers.map((member) => (
                    <Card key={member.id} className="row-card">
                      <div>
                        <h3>{member.name}</h3>
                        <p className="muted">{member.email}</p>
                        {member.phone ? <p className="muted">{member.phone}</p> : null}
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm(t(lang, 'removeStaffConfirm'))) {
                            removeStaff(member.id)
                            showFlash(t(lang, 'staffRemoved'))
                          }
                        }}
                      >
                        {t(lang, 'remove')}
                      </Button>
                    </Card>
                  ))
                ) : (
                  <EmptyState>{t(lang, 'noStaff')}</EmptyState>
                )}
              </div>
            </div>
          ) : null}

          {assignAptId ? (
            <div className="modal-backdrop">
              <Card className="modal-card">
                <h3>{t(lang, 'assignResident')}</h3>
                <p className="muted">{t(lang, 'assignResidentHint')}</p>
                <form className="stack-form" onSubmit={handleAssignResident}>
                  <Field label={t(lang, 'leaseName')}>
                    <Input value={leaseName} onChange={(e) => setLeaseName(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'residentEmailLabel')}>
                    <Input
                      type="email"
                      value={residentEmail}
                      onChange={(e) => setResidentEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'leaseStart')}>
                    <Input
                      type="date"
                      value={leaseStart}
                      onChange={(e) => setLeaseStart(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'leaseEnd')}>
                    <Input
                      type="date"
                      value={leaseEnd}
                      onChange={(e) => setLeaseEnd(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'leaseFullAmount')}>
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      value={leaseAmount}
                      onChange={(e) => setLeaseAmount(e.target.value)}
                      required
                    />
                  </Field>
                  <div className="inline-actions">
                    <Button type="submit">{t(lang, 'assignResident')}</Button>
                    <Button type="button" variant="ghost" onClick={resetAssignForm}>
                      {t(lang, 'cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : null}

          {editLeaseAptId ? (
            <div className="modal-backdrop">
              <Card className="modal-card">
                <h3>{t(lang, 'editLease')}</h3>
                <form className="stack-form" onSubmit={handleEditLease}>
                  <Field label={t(lang, 'leaseName')}>
                    <Input value={leaseName} onChange={(e) => setLeaseName(e.target.value)} required />
                  </Field>
                  <Field label={t(lang, 'leaseStart')}>
                    <Input
                      type="date"
                      value={leaseStart}
                      onChange={(e) => setLeaseStart(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'leaseEnd')}>
                    <Input
                      type="date"
                      value={leaseEnd}
                      onChange={(e) => setLeaseEnd(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={t(lang, 'leaseFullAmount')}>
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      value={leaseAmount}
                      onChange={(e) => setLeaseAmount(e.target.value)}
                      required
                    />
                  </Field>
                  <div className="inline-actions">
                    <Button type="submit">{t(lang, 'save')}</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditLeaseAptId(null)
                        setLeaseName('')
                        setLeaseStart('')
                        setLeaseEnd('')
                        setLeaseAmount('')
                      }}
                    >
                      {t(lang, 'cancel')}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : null}
        </PageShell>
      </main>
    </div>
  )
}
