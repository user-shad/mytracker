import type {
  Apartment,
  Building,
  BuildingContractor,
  MaintenanceTicket,
  TicketCategory,
  TicketStatus,
} from '../types'
import type { Lang } from '../context/LangContext'

export const TICKET_CATEGORIES: TicketCategory[] = [
  'plumbing',
  'electrical',
  'hvac',
  'general',
  'other',
]

export function ticketCategoryLabel(category: TicketCategory, lang: Lang): string {
  const labels: Record<TicketCategory, { en: string; ar: string }> = {
    plumbing: { en: 'Plumbing', ar: 'سباكة' },
    electrical: { en: 'Electrical', ar: 'كهرباء' },
    hvac: { en: 'HVAC / AC', ar: 'تكييف' },
    general: { en: 'General', ar: 'عام' },
    other: { en: 'Other', ar: 'أخرى' },
  }
  return lang === 'ar' ? labels[category].ar : labels[category].en
}

export function ticketStatusLabel(status: TicketStatus, lang: Lang): string {
  const labels: Record<TicketStatus, { en: string; ar: string }> = {
    open: { en: 'Open', ar: 'مفتوحة' },
    in_progress: { en: 'In progress', ar: 'قيد المعالجة' },
    resolved: { en: 'Resolved', ar: 'تم الحل' },
    closed: { en: 'Closed', ar: 'مغلقة' },
  }
  return lang === 'ar' ? labels[status].ar : labels[status].en
}

export function ticketStatusTone(status: TicketStatus): 'good' | 'bad' | 'warn' | 'neutral' {
  if (status === 'resolved' || status === 'closed') return 'good'
  if (status === 'in_progress') return 'warn'
  return 'bad'
}

export function ticketReference(buildingName: string, unitLabel: string): string {
  const code =
    buildingName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() || 'BLD'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TKT-${code}-${unitLabel}-${suffix}`
}

export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function buildTicketWhatsAppMessage(
  ticket: MaintenanceTicket,
  building: Building,
  apartment: Apartment,
  lang: Lang,
): string {
  const category = ticketCategoryLabel(ticket.category, lang)
  if (lang === 'ar') {
    return [
      'طلب صيانة — MlihRent',
      `التذكرة: ${ticket.reference}`,
      `المبنى: ${building.name}`,
      `الوحدة: ${apartment.label}`,
      `الفئة: ${category}`,
      `الموضوع: ${ticket.title}`,
      `التفاصيل: ${ticket.description}`,
    ].join('\n')
  }
  return [
    'MlihRent maintenance request',
    `Ticket: ${ticket.reference}`,
    `Building: ${building.name}`,
    `Unit: ${apartment.label}`,
    `Category: ${category}`,
    `Subject: ${ticket.title}`,
    `Details: ${ticket.description}`,
  ].join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizeWhatsAppPhone(phone)
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildTicketWhatsAppUrl(
  ticket: MaintenanceTicket,
  building: Building,
  apartment: Apartment,
  contractor: BuildingContractor,
  lang: Lang,
): string {
  return buildWhatsAppUrl(
    contractor.phone,
    buildTicketWhatsAppMessage(ticket, building, apartment, lang),
  )
}

export function findContractorForCategory(
  contractors: BuildingContractor[],
  buildingId: string,
  category: TicketCategory,
): BuildingContractor | undefined {
  const forBuilding = contractors.filter((c) => c.buildingId === buildingId)
  return (
    forBuilding.find((c) => c.category === category) ??
    forBuilding.find((c) => c.category === 'general')
  )
}
