import type { AppData } from '../types'

export const SAMPLE_COMPANY_ID = 'sample_demo_company'

export function isSampleLoaded(data: AppData): boolean {
  return data.companies.some((c) => c.id === SAMPLE_COMPANY_ID)
}

export function stripSampleData(existing: AppData): AppData {
  const sampleThreadIds = existing.chatThreads
    .filter((t) => t.companyId === SAMPLE_COMPANY_ID)
    .map((t) => t.id)

  return {
    ...existing,
    companies: existing.companies.filter((c) => c.id !== SAMPLE_COMPANY_ID),
    users: existing.users.filter((u) => u.companyId !== SAMPLE_COMPANY_ID),
    buildings: existing.buildings.filter((b) => b.companyId !== SAMPLE_COMPANY_ID),
    apartments: existing.apartments.filter((a) => a.companyId !== SAMPLE_COMPANY_ID),
    rentRecords: existing.rentRecords.filter((r) => r.companyId !== SAMPLE_COMPANY_ID),
    chatThreads: existing.chatThreads.filter((t) => t.companyId !== SAMPLE_COMPANY_ID),
    chatMessages: existing.chatMessages.filter((m) => !sampleThreadIds.includes(m.threadId)),
    maintenanceTickets: existing.maintenanceTickets.filter((t) => t.companyId !== SAMPLE_COMPANY_ID),
    buildingContractors: existing.buildingContractors.filter((c) => {
      const building = existing.buildings.find((b) => b.id === c.buildingId)
      return building?.companyId !== SAMPLE_COMPANY_ID
    }),
    pendingRegistrations: existing.pendingRegistrations,
    simulatedEmails: existing.simulatedEmails,
    initialized: existing.initialized,
  }
}
