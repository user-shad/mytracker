import type { AppData, BuildingBankAccount, Invoice, PaymentMethod } from '../types'
import { createInvoiceForApartment, emptyBankAccount } from './invoices'
import { syncRentRecordFromInvoice } from './invoiceSync'
import { nowIso } from './utils'

export function upsertInvoice(data: AppData, invoice: Invoice): AppData {
  const invoices = data.invoices.some((item) => item.id === invoice.id)
    ? data.invoices.map((item) => (item.id === invoice.id ? invoice : item))
    : [...data.invoices, invoice]
  return {
    ...data,
    invoices,
    rentRecords: syncRentRecordFromInvoice(data.rentRecords, invoice),
  }
}

export function ensureApartmentInvoice(
  data: AppData,
  apartmentId: string,
  period: string,
): { data: AppData; invoice?: Invoice } {
  const apartment = data.apartments.find((a) => a.id === apartmentId)
  if (!apartment?.residentUserId) return { data }

  const building = data.buildings.find((b) => b.id === apartment.buildingId)
  if (!building) return { data }

  const existing = data.invoices.find(
    (i) => i.apartmentId === apartmentId && i.period === period,
  )
  if (existing) return { data, invoice: existing }

  const invoice = createInvoiceForApartment(apartment, building.name, period)
  return { data: upsertInvoice(data, invoice), invoice }
}

export function ensureBuildingInvoices(data: AppData, buildingId: string, period: string): AppData {
  const apartments = data.apartments.filter(
    (a) => a.buildingId === buildingId && a.residentUserId,
  )
  let next = data
  for (const apartment of apartments) {
    const result = ensureApartmentInvoice(next, apartment.id, period)
    next = result.data
  }
  return next
}

export function getBuildingBankAccount(
  data: AppData,
  buildingId: string,
): BuildingBankAccount {
  return (
    data.buildingBankAccounts.find((b) => b.buildingId === buildingId) ??
    emptyBankAccount(buildingId)
  )
}

export function setBuildingBankAccount(
  data: AppData,
  account: BuildingBankAccount,
): AppData {
  const others = data.buildingBankAccounts.filter((b) => b.buildingId !== account.buildingId)
  return { ...data, buildingBankAccounts: [...others, account] }
}

export function markInvoicePaid(
  data: AppData,
  invoiceId: string,
  method: PaymentMethod,
  verifiedBy?: string,
): AppData {
  const invoice = data.invoices.find((i) => i.id === invoiceId)
  if (!invoice) return data
  const updated: Invoice = {
    ...invoice,
    status: 'paid',
    paymentMethod: method,
    paidAt: nowIso(),
    verifiedBy,
    updatedAt: nowIso(),
  }
  return upsertInvoice(data, updated)
}

export function markInvoiceDue(data: AppData, invoiceId: string): AppData {
  const invoice = data.invoices.find((i) => i.id === invoiceId)
  if (!invoice) return data
  const updated: Invoice = {
    ...invoice,
    status: 'due',
    paymentMethod: undefined,
    proofImage: undefined,
    paidAt: undefined,
    verifiedBy: undefined,
    updatedAt: nowIso(),
  }
  return upsertInvoice(data, updated)
}

export function submitInvoiceProof(
  data: AppData,
  invoiceId: string,
  proofImage: string,
): AppData {
  const invoice = data.invoices.find((i) => i.id === invoiceId)
  if (!invoice || invoice.status === 'paid') return data
  const updated: Invoice = {
    ...invoice,
    status: 'pending_review',
    proofImage,
    paymentMethod: 'bank_transfer',
    updatedAt: nowIso(),
  }
  return upsertInvoice(data, updated)
}

export function addBankAccountForBuilding(data: AppData, buildingId: string): AppData {
  if (data.buildingBankAccounts.some((b) => b.buildingId === buildingId)) return data
  return {
    ...data,
    buildingBankAccounts: [...data.buildingBankAccounts, emptyBankAccount(buildingId)],
  }
}
