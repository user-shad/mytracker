import type { Building, MaintenanceTicket, User } from '../types'
import { ticketCategoryLabel } from './tickets'

export function buildTicketAlertEmail(input: {
  ticket: MaintenanceTicket
  building: Building
  unitLabel: string
  resident?: User
  companyName: string
}): { subject: string; body: string } {
  const category = ticketCategoryLabel(input.ticket.category, 'en')
  const residentName = input.resident?.name ?? 'Resident'
  return {
    subject: `New maintenance ticket — ${input.ticket.reference}`,
    body: [
      `Company: ${input.companyName}`,
      `Building: ${input.building.name}`,
      `Unit: ${input.unitLabel}`,
      `Resident: ${residentName}`,
      `Category: ${category}`,
      `Subject: ${input.ticket.title}`,
      `Details: ${input.ticket.description}`,
      '',
      'Log in to MlihRent to review and notify the contractor.',
    ].join('\n'),
  }
}
