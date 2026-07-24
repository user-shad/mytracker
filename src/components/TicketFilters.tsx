import { Field } from './ui'
import { useLang } from '../context/LangContext'
import { TICKET_CATEGORIES, ticketCategoryLabel, ticketStatusLabel } from '../lib/tickets'
import { t } from '../i18n/translations'
import type { TicketCategory, TicketStatus } from '../types'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export function TicketFilters({
  statusFilter,
  categoryFilter,
  showClosed,
  onStatusChange,
  onCategoryChange,
  onShowClosedChange,
}: {
  statusFilter: '' | TicketStatus
  categoryFilter: '' | TicketCategory
  showClosed: boolean
  onStatusChange: (value: '' | TicketStatus) => void
  onCategoryChange: (value: '' | TicketCategory) => void
  onShowClosedChange: (value: boolean) => void
}) {
  const { lang } = useLang()

  return (
    <div className="ticket-filters">
      <Field label={t(lang, 'filterStatus')}>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as '' | TicketStatus)}
        >
          <option value="">{t(lang, 'allStatuses')}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {ticketStatusLabel(status, lang)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t(lang, 'filterCategory')}>
        <select
          className="input"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as '' | TicketCategory)}
        >
          <option value="">{t(lang, 'allCategories')}</option>
          {TICKET_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {ticketCategoryLabel(category, lang)}
            </option>
          ))}
        </select>
      </Field>
      <label className="ticket-filter-check">
        <input
          type="checkbox"
          checked={showClosed}
          onChange={(e) => onShowClosedChange(e.target.checked)}
        />
        {t(lang, 'showClosedTickets')}
      </label>
    </div>
  )
}

export function filterTickets<T extends { status: TicketStatus; category: TicketCategory }>(
  tickets: T[],
  statusFilter: '' | TicketStatus,
  categoryFilter: '' | TicketCategory,
  showClosed: boolean,
): T[] {
  return tickets.filter((ticket) => {
    if (!showClosed && (ticket.status === 'closed' || ticket.status === 'resolved')) {
      return false
    }
    if (statusFilter && ticket.status !== statusFilter) return false
    if (categoryFilter && ticket.category !== categoryFilter) return false
    return true
  })
}
