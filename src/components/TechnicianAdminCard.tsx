import { useMemo } from 'react'
import { Badge, Card, StatCard } from './ui'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatDisplayDate } from '../lib/formatDate'
import { formatMoney } from '../lib/formatMoney'
import { t } from '../i18n/translations'
import type { Company } from '../types'

export function TechnicianAdminCard({ company }: { company: Company }) {
  const { lang } = useLang()
  const { data, getBuildingPaymentSummary } = useData()
  const period = currentRentPeriod()

  const admin = data.users.find((u) => u.companyId === company.id && u.role === 'admin')
  const buildings = data.buildings.filter((b) => b.companyId === company.id)
  const apartments = data.apartments.filter((a) => a.companyId === company.id)
  const staff = data.users.filter((u) => u.companyId === company.id && u.role === 'staff')
  const residents = data.users.filter((u) => u.companyId === company.id && u.role === 'resident')
  const openTickets = data.maintenanceTickets.filter(
    (ticket) =>
      ticket.companyId === company.id && ticket.status !== 'closed' && ticket.status !== 'resolved',
  )
  const pendingTransfers = data.invoices.filter(
    (invoice) =>
      invoice.companyId === company.id &&
      invoice.period === period &&
      invoice.status === 'pending_review',
  )

  const buildingSummaries = useMemo(
    () =>
      buildings.map((building) => {
        const buildingApartments = apartments.filter((a) => a.buildingId === building.id)
        const occupied = buildingApartments.filter((a) => a.residentUserId).length
        const summary = getBuildingPaymentSummary(building.id, period)
        return { building, buildingApartments, occupied, summary }
      }),
    [buildings, apartments, getBuildingPaymentSummary, period],
  )

  if (!admin) {
    return (
      <Card className="technician-admin-card">
        <h3>{company.name}</h3>
        <p className="muted">{t(lang, 'noAdminAccount')}</p>
      </Card>
    )
  }

  return (
    <Card className="technician-admin-card">
      <div className="technician-admin-head">
        <div>
          <p className="eyebrow">{t(lang, 'company')}</p>
          <h3>{company.name}</h3>
          <p className="muted">
            {t(lang, 'created')}: {formatDisplayDate(company.createdAt.slice(0, 10), lang)}
          </p>
        </div>
        <Badge tone={company.active ? 'good' : 'bad'}>
          {company.active ? t(lang, 'active') : t(lang, 'inactive')}
        </Badge>
      </div>

      <section className="technician-admin-section">
        <h4>{t(lang, 'adminOverview')}</h4>
        <dl className="info-list">
          <div>
            <dt>{t(lang, 'name')}</dt>
            <dd>{admin.name}</dd>
          </div>
          <div>
            <dt>{t(lang, 'email')}</dt>
            <dd>{admin.email}</dd>
          </div>
          <div>
            <dt>{t(lang, 'phone')}</dt>
            <dd>{admin.phone || '—'}</dd>
          </div>
        </dl>
      </section>

      <div className="stat-row">
        <StatCard label={t(lang, 'totalBuildings')} value={buildings.length} />
        <StatCard label={t(lang, 'totalApartments')} value={apartments.length} />
        <StatCard label={t(lang, 'totalResidents')} value={residents.length} />
        <StatCard label={t(lang, 'staff')} value={staff.length} />
        <StatCard label={t(lang, 'openTickets')} value={openTickets.length} />
        <StatCard label={t(lang, 'totalPending')} value={pendingTransfers.length} />
      </div>

      <section className="technician-admin-section">
        <h4>
          {t(lang, 'buildings')} — {formatRentPeriod(period, lang)}
        </h4>
        {buildingSummaries.length ? (
          <div className="technician-building-list">
            {buildingSummaries.map(({ building, buildingApartments, occupied, summary }) => (
              <div key={building.id} className="technician-building-item">
                <div className="technician-building-head">
                  <strong>{building.name}</strong>
                  <span className="muted">
                    {occupied}/{buildingApartments.length} {t(lang, 'occupiedUnits')}
                  </span>
                </div>
                <p className="muted">{building.address}</p>
                <div className="technician-building-stats">
                  <span>
                    {t(lang, 'totalDue')}: {formatMoney(summary.totalDue, lang)}
                  </span>
                  <span>
                    {t(lang, 'totalPaid')}: {formatMoney(summary.totalPaid, lang)}
                  </span>
                  <span>
                    {t(lang, 'totalPending')}: {formatMoney(summary.totalPending, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{t(lang, 'noBuildingsYet')}</p>
        )}
      </section>

      {staff.length ? (
        <section className="technician-admin-section">
          <h4>{t(lang, 'staff')}</h4>
          <ul className="technician-mini-list">
            {staff.map((member) => (
              <li key={member.id}>
                <strong>{member.name}</strong>
                <span className="muted">{member.email}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openTickets.length ? (
        <section className="technician-admin-section">
          <h4>{t(lang, 'openTickets')}</h4>
          <ul className="technician-mini-list">
            {openTickets.slice(0, 5).map((ticket) => {
              const apt = apartments.find((a) => a.id === ticket.apartmentId)
              const building = buildings.find((b) => b.id === ticket.buildingId)
              return (
                <li key={ticket.id}>
                  <strong>{ticket.title}</strong>
                  <span className="muted">
                    {building?.name ?? '—'} · {apt?.label ?? '—'} · <code>{ticket.reference}</code>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </Card>
  )
}
