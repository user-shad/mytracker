import type { AppData, Invoice, RentRecord } from '../types'
import { createInvoiceForApartment } from './invoices'

export function migrateRentRecordsToInvoices(data: AppData): AppData {
  if (data.invoices.length) return data

  const buildingNames = new Map(data.buildings.map((b) => [b.id, b.name]))
  const invoices: Invoice[] = []

  for (const record of data.rentRecords) {
    const apartment = data.apartments.find((a) => a.id === record.apartmentId)
    if (!apartment) continue
    const buildingName = buildingNames.get(record.buildingId) ?? 'BLD'
    const invoice = createInvoiceForApartment(apartment, buildingName, record.period)
    invoices.push({
      ...invoice,
      status: record.status === 'paid' ? 'paid' : 'due',
      paymentMethod: record.status === 'paid' ? 'manual' : undefined,
      paidAt: record.status === 'paid' ? record.updatedAt : undefined,
      updatedAt: record.updatedAt,
    })
  }

  return { ...data, invoices }
}

export function syncRentRecordFromInvoice(
  records: RentRecord[],
  invoice: Invoice,
): RentRecord[] {
  const existing = records.find(
    (r) => r.apartmentId === invoice.apartmentId && r.period === invoice.period,
  )
  const status = invoice.status === 'paid' ? 'paid' : 'unpaid'
  const next: RentRecord = existing
    ? { ...existing, status, updatedAt: invoice.updatedAt }
    : {
        id: `rent_${invoice.apartmentId}_${invoice.period}`,
        companyId: invoice.companyId,
        buildingId: invoice.buildingId,
        apartmentId: invoice.apartmentId,
        period: invoice.period,
        status,
        updatedAt: invoice.updatedAt,
      }

  return [
    ...records.filter(
      (r) => !(r.apartmentId === invoice.apartmentId && r.period === invoice.period),
    ),
    next,
  ]
}
