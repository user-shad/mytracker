import type { Apartment, BuildingBankAccount, Invoice, PaymentMethod } from '../types'
import { currentRentPeriod } from './rentPeriod'
import { uid, nowIso } from './utils'

export function leaseMonths(start: string, end: string): number {
  if (!start || !end) return 1
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1)
}

export function monthlyRentAmount(apartment: Apartment): number {
  if (!apartment.leaseAmount || !apartment.leaseStart || !apartment.leaseEnd) return 0
  const months = leaseMonths(apartment.leaseStart, apartment.leaseEnd)
  return Math.round((apartment.leaseAmount / months) * 100) / 100
}

export function invoiceReference(
  buildingName: string,
  period: string,
  unitLabel: string,
): string {
  const code =
    buildingName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase() || 'BLD'
  return `INV-${code}-${period.replace('-', '')}-${unitLabel}`
}

export function emptyBankAccount(buildingId: string): BuildingBankAccount {
  return {
    buildingId,
    accountName: '',
    bankName: '',
    iban: '',
    accountNumber: '',
    swift: '',
    bankAddress: '',
  }
}

export function isBankConfigured(bank: BuildingBankAccount): boolean {
  return Boolean(bank.accountName.trim() && bank.iban.trim())
}

export function createInvoiceForApartment(
  apartment: Apartment,
  buildingName: string,
  period = currentRentPeriod(),
): Invoice {
  const amount = monthlyRentAmount(apartment)
  const reference = invoiceReference(buildingName, period, apartment.label)
  const now = nowIso()
  return {
    id: uid('inv_'),
    reference,
    companyId: apartment.companyId,
    buildingId: apartment.buildingId,
    apartmentId: apartment.id,
    period,
    amount,
    status: 'due',
    createdAt: now,
    updatedAt: now,
  }
}

export function paymentMethodLabel(method: PaymentMethod, lang: 'en' | 'ar'): string {
  const labels: Record<PaymentMethod, { en: string; ar: string }> = {
    bank_transfer: { en: 'Bank transfer', ar: 'تحويل بنكي' },
    apple_pay: { en: 'Apple Pay', ar: 'Apple Pay' },
    card: { en: 'Card', ar: 'بطاقة' },
    manual: { en: 'Manual', ar: 'يدوي' },
  }
  return lang === 'ar' ? labels[method].ar : labels[method].en
}
