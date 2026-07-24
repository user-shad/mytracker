import type {
  AppData,
  BuildingContractor,
  MaintenanceTicket,
  TicketCategory,
  TicketStatus,
} from '../types'
import { findContractorForCategory, ticketReference } from './tickets'
import { nowIso, uid } from './utils'

export function upsertTicket(data: AppData, ticket: MaintenanceTicket): AppData {
  const exists = data.maintenanceTickets.some((t) => t.id === ticket.id)
  return {
    ...data,
    maintenanceTickets: exists
      ? data.maintenanceTickets.map((t) => (t.id === ticket.id ? ticket : t))
      : [ticket, ...data.maintenanceTickets],
  }
}

export function createMaintenanceTicket(
  data: AppData,
  input: {
    companyId: string
    buildingId: string
    apartmentId: string
    residentUserId: string
    buildingName: string
    unitLabel: string
    category: TicketCategory
    title: string
    description: string
  },
): { data: AppData; ticket: MaintenanceTicket } {
  const contractor = findContractorForCategory(
    data.buildingContractors,
    input.buildingId,
    input.category,
  )
  const now = nowIso()
  const ticket: MaintenanceTicket = {
    id: uid('tkt_'),
    reference: ticketReference(input.buildingName, input.unitLabel),
    companyId: input.companyId,
    buildingId: input.buildingId,
    apartmentId: input.apartmentId,
    residentUserId: input.residentUserId,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    status: 'open',
    contractorId: contractor?.id,
    createdAt: now,
    updatedAt: now,
  }
  return { data: upsertTicket(data, ticket), ticket }
}

export function updateTicketStatus(
  data: AppData,
  ticketId: string,
  status: TicketStatus,
): AppData {
  const ticket = data.maintenanceTickets.find((t) => t.id === ticketId)
  if (!ticket) return data
  const updated: MaintenanceTicket = {
    ...ticket,
    status,
    updatedAt: nowIso(),
    resolvedAt: status === 'resolved' || status === 'closed' ? nowIso() : undefined,
  }
  return upsertTicket(data, updated)
}

export function assignTicketContractor(
  data: AppData,
  ticketId: string,
  contractorId: string | undefined,
): AppData {
  const ticket = data.maintenanceTickets.find((t) => t.id === ticketId)
  if (!ticket) return data
  const updated: MaintenanceTicket = {
    ...ticket,
    contractorId,
    updatedAt: nowIso(),
  }
  return upsertTicket(data, updated)
}

export function upsertBuildingContractor(
  data: AppData,
  contractor: BuildingContractor,
): AppData {
  const others = data.buildingContractors.filter(
    (c) =>
      !(
        c.buildingId === contractor.buildingId &&
        c.category === contractor.category &&
        c.id !== contractor.id
      ),
  )
  const exists = others.some((c) => c.id === contractor.id)
  return {
    ...data,
    buildingContractors: exists
      ? others.map((c) => (c.id === contractor.id ? contractor : c))
      : [...others, contractor],
  }
}

export function removeBuildingContractor(data: AppData, contractorId: string): AppData {
  return {
    ...data,
    buildingContractors: data.buildingContractors.filter((c) => c.id !== contractorId),
    maintenanceTickets: data.maintenanceTickets.map((ticket) =>
      ticket.contractorId === contractorId ? { ...ticket, contractorId: undefined } : ticket,
    ),
  }
}

export function logTicketWhatsAppNotify(
  data: AppData,
  ticketId: string,
  userId: string,
): AppData {
  const ticket = data.maintenanceTickets.find((t) => t.id === ticketId)
  if (!ticket) return data
  const updated: MaintenanceTicket = {
    ...ticket,
    whatsappNotifiedAt: nowIso(),
    whatsappNotifiedBy: userId,
    updatedAt: nowIso(),
  }
  return upsertTicket(data, updated)
}

export function getBuildingContractors(data: AppData, buildingId: string): BuildingContractor[] {
  return data.buildingContractors
    .filter((c) => c.buildingId === buildingId)
    .sort((a, b) => a.category.localeCompare(b.category))
}
