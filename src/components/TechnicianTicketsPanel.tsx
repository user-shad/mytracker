import { useMemo, useState } from 'react'
import { Badge, Card, EmptyState, Field } from './ui'
import { TicketFilters, filterTickets } from './TicketFilters'
import { TicketWhatsAppButton, TicketWhatsAppLog } from './TicketWhatsAppButton'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { formatDisplayDate } from '../lib/formatDate'
import { ticketCategoryLabel, ticketStatusLabel, ticketStatusTone } from '../lib/tickets'
import { t } from '../i18n/translations'
import type { TicketCategory, TicketStatus } from '../types'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export function TechnicianTicketsPanel({
  onNotice,
}: {
  onNotice: (message: string, tone?: 'good' | 'bad' | 'info') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const {
    data,
    updateTicketStatus,
    assignTicketContractor,
    getBuildingContractors,
  } = useData()

  const [companyId, setCompanyId] = useState(data.companies[0]?.id ?? '')
  const [buildingId, setBuildingId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('')
  const [categoryFilter, setCategoryFilter] = useState<'' | TicketCategory>('')
  const [showClosed, setShowClosed] = useState(false)

  const buildings = data.buildings.filter((b) => b.companyId === companyId)
  const tickets = useMemo(() => {
    let list = data.maintenanceTickets.filter((ticket) => ticket.companyId === companyId)
    if (buildingId) list = list.filter((ticket) => ticket.buildingId === buildingId)
    list = filterTickets(list, statusFilter, categoryFilter, showClosed)
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [
    data.maintenanceTickets,
    companyId,
    buildingId,
    statusFilter,
    categoryFilter,
    showClosed,
  ])

  const companyName = data.companies.find((c) => c.id === companyId)?.name ?? '—'
  const aptLabel = (apartmentId: string) =>
    data.apartments.find((a) => a.id === apartmentId)?.label ?? '—'
  const buildingName = (id: string) => data.buildings.find((b) => b.id === id)?.name ?? '—'

  if (!data.companies.length) {
    return (
      <Card>
        <EmptyState>{t(lang, 'noCompanies')}</EmptyState>
      </Card>
    )
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <h3>{t(lang, 'technicianTickets')}</h3>
        <p className="muted">{t(lang, 'technicianTicketsHint')}</p>
        <div className="ticket-filters">
          <Field label={t(lang, 'company')}>
            <select className="input" value={companyId} onChange={(e) => {
              setCompanyId(e.target.value)
              setBuildingId('')
            }}>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(lang, 'selectBuilding')}>
            <select className="input" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
              <option value="">{t(lang, 'allBuildings')}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <TicketFilters
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          showClosed={showClosed}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategoryFilter}
          onShowClosedChange={setShowClosed}
        />
      </Card>

      {tickets.length ? (
        <div className="stack-gap">
          {tickets.map((ticket) => {
            const contractors = getBuildingContractors(ticket.buildingId)
            return (
              <Card key={ticket.id} className="ticket-card">
                <div className="transfer-review-head">
                  <div>
                    <strong>{ticket.title}</strong>
                    <p className="muted">
                      {companyName} · {buildingName(ticket.buildingId)} · {aptLabel(ticket.apartmentId)} ·{' '}
                      <code>{ticket.reference}</code>
                    </p>
                  </div>
                  <Badge tone={ticketStatusTone(ticket.status)}>
                    {ticketStatusLabel(ticket.status, lang)}
                  </Badge>
                </div>
                <p>{ticket.description}</p>
                <p className="muted">
                  {ticketCategoryLabel(ticket.category, lang)} ·{' '}
                  {formatDisplayDate(ticket.createdAt.slice(0, 10), lang)}
                </p>
                <div className="ticket-controls">
                  <Field label={t(lang, 'status')}>
                    <select
                      className="input"
                      value={ticket.status}
                      onChange={(e) => {
                        updateTicketStatus(ticket.id, e.target.value as TicketStatus)
                        onNotice(t(lang, 'ticketStatusUpdated'), 'good')
                      }}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ticketStatusLabel(status, lang)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t(lang, 'assignedContractor')}>
                    <select
                      className="input"
                      value={ticket.contractorId ?? ''}
                      onChange={(e) =>
                        assignTicketContractor(ticket.id, e.target.value || undefined)
                      }
                    >
                      <option value="">{t(lang, 'noContractorYet')}</option>
                      {contractors.map((contractor) => (
                        <option key={contractor.id} value={contractor.id}>
                          {ticketCategoryLabel(contractor.category, lang)} — {contractor.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <TicketWhatsAppLog ticketId={ticket.id} />
                {user ? (
                  <TicketWhatsAppButton
                    ticketId={ticket.id}
                    userId={user.id}
                    onLogged={() => onNotice(t(lang, 'whatsappLogged'), 'info')}
                  />
                ) : null}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState>{t(lang, 'noTickets')}</EmptyState>
        </Card>
      )}
    </div>
  )
}
