import { useState, type FormEvent } from 'react'
import { Badge, Button, Card, EmptyState, Field, Input } from './ui'
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
import { TicketWhatsAppButton, TicketWhatsAppLog } from './TicketWhatsAppButton'
import { t } from '../i18n/translations'
import type { TicketCategory } from '../types'

export function ResidentTicketsPanel({
  onNotice,
}: {
  onNotice: (message: string, tone?: 'good' | 'bad') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const { data, createTicket, getTicketsForResident } = useData()
  const [category, setCategory] = useState<TicketCategory>('general')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const tickets = user ? getTicketsForResident(user.id) : []

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    const result = createTicket(user.id, { category, title, description })
    if (!result.ok) {
      onNotice(t(lang, 'required'), 'bad')
      return
    }
    setTitle('')
    setDescription('')
    setCategory('general')
    onNotice(t(lang, 'ticketCreated') + ' ' + t(lang, 'ticketAlertSent'), 'good')
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <h3>{t(lang, 'reportIssue')}</h3>
        <p className="muted">{t(lang, 'reportIssueHint')}</p>
        <form className="stack-form" onSubmit={handleSubmit}>
          <Field label={t(lang, 'ticketCategory')}>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              {TICKET_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {ticketCategoryLabel(item, lang)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(lang, 'ticketTitle')}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label={t(lang, 'ticketDescription')}>
            <textarea
              className="input ticket-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Field>
          <Button type="submit">{t(lang, 'submitTicket')}</Button>
        </form>
      </Card>

      <Card>
        <h3>{t(lang, 'myTickets')}</h3>
        {tickets.length ? (
          <div className="stack-gap">
            {tickets.map((ticket) => {
              const contractor = ticket.contractorId
                ? data.buildingContractors.find((c) => c.id === ticket.contractorId)
                : undefined
              return (
                <div key={ticket.id} className="transfer-review-card ticket-card">
                  <div className="transfer-review-head">
                    <div>
                      <strong>{ticket.title}</strong>
                      <p className="muted">
                        <code>{ticket.reference}</code> · {ticketCategoryLabel(ticket.category, lang)}
                      </p>
                    </div>
                    <Badge tone={ticketStatusTone(ticket.status)}>
                      {ticketStatusLabel(ticket.status, lang)}
                    </Badge>
                  </div>
                  <p>{ticket.description}</p>
                  <p className="muted">{formatDisplayDate(ticket.createdAt.slice(0, 10), lang)}</p>
                  {contractor ? (
                    <p className="muted">
                      {t(lang, 'assignedContractor')}: {contractor.name}
                    </p>
                  ) : (
                    <p className="muted">{t(lang, 'noContractorYet')}</p>
                  )}
                  <TicketWhatsAppLog ticketId={ticket.id} />
                  {user ? (
                    <TicketWhatsAppButton ticketId={ticket.id} userId={user.id} />
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
  )
}
