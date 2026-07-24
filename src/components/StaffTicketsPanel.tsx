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

export function StaffTicketsPanel({
  companyId,
  onNotice,
}: {
  companyId: string
  onNotice: (message: string, tone?: 'good' | 'bad' | 'info') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const { data, getTicketsForCompany, updateTicketStatus, getBuildingsForCompany } = useData()
  const buildings = getBuildingsForCompany(companyId)
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('')
  const [categoryFilter, setCategoryFilter] = useState<'' | TicketCategory>('')
  const [showClosed, setShowClosed] = useState(false)

  const tickets = useMemo(() => {
    let all = getTicketsForCompany(companyId)
    if (selectedBuildingId) {
      all = all.filter((ticket) => ticket.buildingId === selectedBuildingId)
    }
    return filterTickets(all, statusFilter, categoryFilter, showClosed)
  }, [companyId, getTicketsForCompany, selectedBuildingId, statusFilter, categoryFilter, showClosed])

  const buildingName = (buildingId: string) =>
    data.buildings.find((b) => b.id === buildingId)?.name ?? '—'

  const aptLabel = (apartmentId: string) =>
    data.apartments.find((a) => a.id === apartmentId)?.label ?? '—'

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <h3>{t(lang, 'maintenanceTickets')}</h3>
        <p className="muted">{t(lang, 'staffTicketsHint')}</p>
        {buildings.length ? (
          <Field label={t(lang, 'selectBuilding')}>
            <select
              className="input"
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              <option value="">{t(lang, 'allBuildings')}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
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
            const contractor = ticket.contractorId
              ? data.buildingContractors.find((c) => c.id === ticket.contractorId)
              : undefined
            return (
              <Card key={ticket.id} className="ticket-card">
                <div className="transfer-review-head">
                  <div>
                    <strong>{ticket.title}</strong>
                    <p className="muted">
                      {buildingName(ticket.buildingId)} · {aptLabel(ticket.apartmentId)} ·{' '}
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
                {contractor ? (
                  <p className="muted">
                    {t(lang, 'assignedContractor')}: {contractor.name}
                  </p>
                ) : (
                  <p className="muted">{t(lang, 'noContractorYet')}</p>
                )}
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
          <EmptyState>{showClosed ? t(lang, 'noTickets') : t(lang, 'noOpenTickets')}</EmptyState>
        </Card>
      )}
    </div>
  )
}
