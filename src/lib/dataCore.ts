import { PLATFORM } from '../config/constants'
import { hashPassword } from './password'
import type { AppData, User } from '../types'
import { migrateRentRecordsToInvoices } from './invoiceSync'
import { nowIso, uid } from './utils'

const LEGACY_DEMO_COMPANY_IDS = new Set(['demo_alnoor_co', 'sample_demo_company'])

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

export function seedTechnician(password: string): User {
  return {
    id: uid('usr_'),
    companyId: null,
    role: 'technician',
    email: PLATFORM.technicianEmail,
    password: hashPassword(password),
    name: PLATFORM.technicianName,
    createdAt: nowIso(),
  }
}

function stripLegacyDemoData(existing: AppData): AppData {
  const hasLegacy =
    existing.companies.some((c) => LEGACY_DEMO_COMPANY_IDS.has(c.id)) ||
    existing.pendingRegistrations.some((r) => r.id.startsWith('demo_')) ||
    existing.simulatedEmails.some((e) => e.id.startsWith('demo_'))

  if (!hasLegacy) return existing

  const demoCompanyIds = new Set(
    existing.companies.filter((c) => LEGACY_DEMO_COMPANY_IDS.has(c.id)).map((c) => c.id),
  )
  const demoThreadIds = existing.chatThreads
    .filter((t) => demoCompanyIds.has(t.companyId))
    .map((t) => t.id)

  return {
    ...existing,
    pendingRegistrations: existing.pendingRegistrations.filter((r) => !r.id.startsWith('demo_')),
    companies: existing.companies.filter((c) => !demoCompanyIds.has(c.id)),
    users: existing.users.filter((u) => u.companyId === null || !demoCompanyIds.has(u.companyId)),
    buildings: existing.buildings.filter((b) => !demoCompanyIds.has(b.companyId)),
    apartments: existing.apartments.filter((a) => {
      const building = existing.buildings.find((b) => b.id === a.buildingId)
      return building && !demoCompanyIds.has(building.companyId)
    }),
    rentRecords: existing.rentRecords.filter((r) => !demoCompanyIds.has(r.companyId)),
    invoices: existing.invoices.filter((i) => !demoCompanyIds.has(i.companyId)),
    buildingBankAccounts: existing.buildingBankAccounts.filter((a) => {
      const building = existing.buildings.find((b) => b.id === a.buildingId)
      return building && !demoCompanyIds.has(building.companyId)
    }),
    chatThreads: existing.chatThreads.filter((t) => !demoCompanyIds.has(t.companyId)),
    chatMessages: existing.chatMessages.filter((m) => !demoThreadIds.includes(m.threadId)),
    maintenanceTickets: existing.maintenanceTickets.filter((t) => !demoCompanyIds.has(t.companyId)),
    buildingContractors: existing.buildingContractors.filter((c) => {
      const building = existing.buildings.find((b) => b.id === c.buildingId)
      return building && !demoCompanyIds.has(building.companyId)
    }),
    simulatedEmails: existing.simulatedEmails.filter((e) => !e.id.startsWith('demo_')),
    initialized: existing.initialized,
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

export function bootstrapFromRaw(
  raw: Partial<AppData> | null | undefined,
  technicianPassword?: string,
): AppData {
  if (!raw) {
    const data = finalizeData(emptyData())
    if (technicianPassword) {
      data.users.push(seedTechnician(technicianPassword))
    }
    data.initialized = true
    return data
  }

  let parsed = stripLegacyDemoData(migrate(raw))
  parsed = finalizeData(parsed)
  if (technicianPassword && !parsed.users.some((u) => u.role === 'technician')) {
    parsed.users.push(seedTechnician(technicianPassword))
  }
  return parsed
}
