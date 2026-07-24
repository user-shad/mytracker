import { Button } from './ui'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { buildTicketWhatsAppUrl } from '../lib/tickets'
import { t } from '../i18n/translations'

export function TicketWhatsAppButton({
  ticketId,
  userId,
  onLogged,
}: {
  ticketId: string
  userId: string
  onLogged?: () => void
}) {
  const { lang } = useLang()
  const { data, logTicketWhatsAppNotify } = useData()

  const ticket = data.maintenanceTickets.find((item) => item.id === ticketId)
  if (!ticket?.contractorId) return null
  if (ticket.status === 'closed' || ticket.status === 'resolved') return null

  const contractor = data.buildingContractors.find((c) => c.id === ticket.contractorId)
  const building = data.buildings.find((b) => b.id === ticket.buildingId)
  const apartment = data.apartments.find((a) => a.id === ticket.apartmentId)
  if (!contractor || !building || !apartment) return null

  const href = buildTicketWhatsAppUrl(ticket, building, apartment, contractor, lang)
  if (!href) return null

  const handleClick = () => {
    logTicketWhatsAppNotify(ticketId, userId)
    onLogged?.()
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button type="button" variant="soft" className="ticket-wa-link" onClick={handleClick}>
      {t(lang, 'notifyWhatsApp')}
    </Button>
  )
}

export function TicketWhatsAppLog({ ticketId }: { ticketId: string }) {
  const { lang } = useLang()
  const { data } = useData()
  const ticket = data.maintenanceTickets.find((item) => item.id === ticketId)
  if (!ticket?.whatsappNotifiedAt) return null

  const notifier = ticket.whatsappNotifiedBy
    ? data.users.find((u) => u.id === ticket.whatsappNotifiedBy)
    : undefined

  return (
    <p className="muted ticket-notify-log">
      {t(lang, 'whatsappNotified')}: {new Date(ticket.whatsappNotifiedAt).toLocaleString()}
      {notifier ? ` · ${notifier.name}` : ''}
    </p>
  )
}
