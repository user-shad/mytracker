import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge, Button, Card, EmptyState, Field, Input } from './ui'
import { TicketFilters, filterTickets } from './TicketFilters'
import { TicketWhatsAppButton, TicketWhatsAppLog } from './TicketWhatsAppButton'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { formatDisplayDate } from '../lib/formatDate'
import {
  TICKET_CATEGORIES,
  ticketCategoryLabel,
  ticketStatusLabel,
  ticketStatusTone,
} from '../lib/tickets'
import { t } from '../i18n/translations'
import type { Building, TicketCategory, TicketStatus } from '../types'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export function AdminTicketsPanel({
  buildings,
  onNotice,
}: {
  buildings: Building[]
  onNotice: (message: string, tone?: 'good' | 'bad' | 'info') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const {
    data,
    getTicketsForCompany,
    updateTicketStatus,
    assignTicketContractor,
    getBuildingContractors,
    saveBuildingContractor,
    removeBuildingContractor,
  } = useData()

  const companyId = buildings[0]?.companyId ?? ''
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0]?.id ?? '')
  const [contractorCategory, setContractorCategory] = useState<TicketCategory>('plumbing')
  const [contractorName, setContractorName] = useState('')
  const [contractorPhone, setContractorPhone] = useState('')
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('')
  const [categoryFilter, setCategoryFilter] = useState<'' | TicketCategory>('')
  const [showClosed, setShowClosed] = useState(true)

  useEffect(() => {
    if (!selectedBuildingId && buildings[0]) setSelectedBuildingId(buildings[0].id)
  }, [buildings, selectedBuildingId])

  const contractors = selectedBuildingId ? getBuildingContractors(selectedBuildingId) : []
  const tickets = useMemo(() => {
    const all = companyId ? getTicketsForCompany(companyId) : []
    const scoped = selectedBuildingId
      ? all.filter((ticket) => ticket.buildingId === selectedBuildingId)
      : all
    return filterTickets(scoped, statusFilter, categoryFilter, showClosed)
  }, [
    companyId,
    getTicketsForCompany,
    selectedBuildingId,
    statusFilter,
    categoryFilter,
    showClosed,
  ])

  const aptLabel = (apartmentId: string) =>
    data.apartments.find((a) => a.id === apartmentId)?.label ?? '—'

  const handleContractorSave = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedBuildingId) return
    const result = saveBuildingContractor(selectedBuildingId, {
      id: editingContractorId ?? undefined,
      category: contractorCategory,
      name: contractorName,
      phone: contractorPhone,
    })
    if (!result.ok) {
      onNotice(t(lang, 'required'), 'bad')
      return
    }
    setContractorName('')
    setContractorPhone('')
    setEditingContractorId(null)
    onNotice(t(lang, 'contractorSaved'), 'good')
  }

  const startEditContractor = (contractorId: string) => {
    const contractor = contractors.find((c) => c.id === contractorId)
    if (!contractor) return
    setEditingContractorId(contractor.id)
    setContractorCategory(contractor.category)
    setContractorName(contractor.name)
    setContractorPhone(contractor.phone)
  }

  if (!buildings.length) {
    return (
      <Card>
        <EmptyState>{t(lang, 'noTickets')}</EmptyState>
      </Card>
    )
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <Field label={t(lang, 'selectBuilding')}>
          <select
            className="input"
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <div className="two-col">
        <Card>
          <h3>{t(lang, 'contractors')}</h3>
          <p className="muted">{t(lang, 'contractorsHint')}</p>
          <form className="stack-form" onSubmit={handleContractorSave}>
            <Field label={t(lang, 'ticketCategory')}>
              <select
                className="input"
                value={contractorCategory}
                onChange={(e) => setContractorCategory(e.target.value as TicketCategory)}
              >
                {TICKET_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {ticketCategoryLabel(item, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t(lang, 'contractorName')}>
              <Input
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                required
              />
            </Field>
            <Field label={t(lang, 'contractorPhone')} hint={t(lang, 'contractorPhoneHint')}>
              <Input
                value={contractorPhone}
                onChange={(e) => setContractorPhone(e.target.value)}
                required
              />
            </Field>
            <div className="inline-actions">
              <Button type="submit">{editingContractorId ? t(lang, 'save') : t(lang, 'add')}</Button>
              {editingContractorId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingContractorId(null)
                    setContractorName('')
                    setContractorPhone('')
                  }}
                >
                  {t(lang, 'cancel')}
                </Button>
              ) : null}
            </div>
          </form>
          {contractors.length ? (
            <ul className="contractor-list">
              {contractors.map((contractor) => (
                <li key={contractor.id}>
                  <div>
                    <strong>{ticketCategoryLabel(contractor.category, lang)}</strong>
                    <p className="muted">
                      {contractor.name} · {contractor.phone}
                    </p>
                  </div>
                  <div className="inline-actions">
                    <Button type="button" variant="ghost" onClick={() => startEditContractor(contractor.id)}>
                      {t(lang, 'edit')}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (confirm(t(lang, 'removeContractorConfirm'))) {
                          removeBuildingContractor(contractor.id)
                          onNotice(t(lang, 'contractorRemoved'), 'good')
                        }
                      }}
                    >
                      {t(lang, 'remove')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t(lang, 'noContractors')}</EmptyState>
          )}
        </Card>

        <Card>
          <h3>{t(lang, 'maintenanceTickets')}</h3>
          <TicketFilters
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            showClosed={showClosed}
            onStatusChange={setStatusFilter}
            onCategoryChange={setCategoryFilter}
            onShowClosedChange={setShowClosed}
          />
          {tickets.length ? (
            <div className="stack-gap">
              {tickets.map((ticket) => {
                const buildingContractors = getBuildingContractors(ticket.buildingId)
                return (
                  <div key={ticket.id} className="transfer-review-card ticket-card">
                    <div className="transfer-review-head">
                      <div>
                        <strong>{ticket.title}</strong>
                        <p className="muted">
                          {aptLabel(ticket.apartmentId)} · <code>{ticket.reference}</code>
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
                          {buildingContractors.map((contractor) => (
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
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState>{t(lang, 'noTickets')}</EmptyState>
          )}
        </Card>
      </div>
    </div>
  )
}
