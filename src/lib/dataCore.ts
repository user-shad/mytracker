import { PLATFORM } from '../config/constants'
import type { AppData, User } from '../types'
import { migrateRentRecordsToInvoices } from './invoiceSync'
import { isSampleLoaded, stripSampleData } from './sampleData'
import { nowIso, uid } from './utils'

export function emptyData(): AppData {
  return {
    pendingRegistrations: [],
    companies: [],
    users: [],
    buildings: [],
    apartments: [],
    rentRecords: [],
    invoices: [],
    buildingBankAccounts: [],
    chatThreads: [],
    chatMessages: [],
    maintenanceTickets: [],
    buildingContractors: [],
    simulatedEmails: [],
    initialized: false,
  }
}

export function seedTechnician(): User {
  return {
    id: uid('usr_'),
    companyId: null,
    role: 'technician',
    email: PLATFORM.technicianEmail,
    password: PLATFORM.technicianPassword,
    name: PLATFORM.technicianName,
    createdAt: nowIso(),
  }
}

export function migrate(parsed: Partial<AppData>): AppData {
  return {
    pendingRegistrations: parsed.pendingRegistrations ?? [],
    companies: parsed.companies ?? [],
    users: parsed.users ?? [],
    buildings: parsed.buildings ?? [],
    apartments: (parsed.apartments ?? []).map((a) => ({
      ...a,
      leaseStart: a.leaseStart ?? '',
      leaseEnd: a.leaseEnd ?? '',
      leaseAmount: a.leaseAmount ?? 0,
    })),
    rentRecords: parsed.rentRecords ?? [],
    invoices: parsed.invoices ?? [],
    buildingBankAccounts: parsed.buildingBankAccounts ?? [],
    chatThreads: parsed.chatThreads ?? [],
    chatMessages: parsed.chatMessages ?? [],
    maintenanceTickets: parsed.maintenanceTickets ?? [],
    buildingContractors: parsed.buildingContractors ?? [],
    simulatedEmails: parsed.simulatedEmails ?? [],
    initialized: parsed.initialized ?? true,
  }
}

export function finalizeData(data: AppData): AppData {
  return migrateRentRecordsToInvoices(data)
}

export function bootstrapFromRaw(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw) {
    const data = finalizeData(emptyData())
    data.users.push(seedTechnician())
    data.initialized = true
    return data
  }

  let parsed = migrate(raw)
  if (isSampleLoaded(parsed)) {
    parsed = stripSampleData(parsed)
  }
  parsed = finalizeData(parsed)
  if (!parsed.users.some((u) => u.role === 'technician')) {
    parsed.users.push(seedTechnician())
  }
  return parsed
}
