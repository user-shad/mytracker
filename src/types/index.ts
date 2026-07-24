export type UserRole = 'technician' | 'admin' | 'staff' | 'resident'

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export type RentStatus = 'paid' | 'unpaid'

export type PaymentMethod = 'bank_transfer' | 'apple_pay' | 'card' | 'manual'

export type InvoiceStatus = 'due' | 'pending_review' | 'paid'

export type ChatThreadStatus = 'ai' | 'staff' | 'closed'

export type MessageSenderRole = 'resident' | 'staff' | 'ai' | 'system'

export type TicketCategory = 'plumbing' | 'electrical' | 'hvac' | 'general' | 'other'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface PendingRegistration {
  id: string
  companyName: string
  adminName: string
  adminEmail: string
  phone?: string
  status: RegistrationStatus
  createdAt: string
  reviewedAt?: string
}

export interface Company {
  id: string
  name: string
  createdAt: string
  active: boolean
}

export interface User {
  id: string
  companyId: string | null
  role: UserRole
  email: string
  password: string
  name: string
  phone?: string
  createdAt: string
}

export interface Building {
  id: string
  companyId: string
  name: string
  address: string
  unitPrefix: string
  apartmentCount: number
  createdAt: string
}

export interface Apartment {
  id: string
  companyId: string
  buildingId: string
  label: string
  leaseName: string
  leaseStart: string
  leaseEnd: string
  leaseAmount: number
  residentEmail: string
  residentUserId?: string
}

export interface RentRecord {
  id: string
  companyId: string
  buildingId: string
  apartmentId: string
  period: string
  status: RentStatus
  updatedAt: string
}

export interface BuildingBankAccount {
  buildingId: string
  accountName: string
  bankName: string
  iban: string
  accountNumber: string
  swift: string
  bankAddress: string
}

export interface Invoice {
  id: string
  reference: string
  companyId: string
  buildingId: string
  apartmentId: string
  period: string
  amount: number
  status: InvoiceStatus
  paymentMethod?: PaymentMethod
  proofImage?: string
  paidAt?: string
  verifiedBy?: string
  createdAt: string
  updatedAt: string
}

export interface ChatThread {
  id: string
  companyId: string
  residentUserId: string
  apartmentId: string
  status: ChatThreadStatus
  assignedStaffId?: string
  updatedAt: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  threadId: string
  senderRole: MessageSenderRole
  senderUserId?: string
  body: string
  createdAt: string
}

export interface BuildingContractor {
  id: string
  buildingId: string
  category: TicketCategory
  name: string
  phone: string
}

export interface MaintenanceTicket {
  id: string
  reference: string
  companyId: string
  buildingId: string
  apartmentId: string
  residentUserId: string
  category: TicketCategory
  title: string
  description: string
  status: TicketStatus
  contractorId?: string
  whatsappNotifiedAt?: string
  whatsappNotifiedBy?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface SimulatedEmail {
  id: string
  to: string
  subject: string
  body: string
  createdAt: string
  kind: 'technician_alert' | 'approval' | 'rejection' | 'staff_welcome' | 'ticket_alert'
}

export interface AppData {
  pendingRegistrations: PendingRegistration[]
  companies: Company[]
  users: User[]
  buildings: Building[]
  apartments: Apartment[]
  rentRecords: RentRecord[]
  invoices: Invoice[]
  buildingBankAccounts: BuildingBankAccount[]
  chatThreads: ChatThread[]
  chatMessages: ChatMessage[]
  maintenanceTickets: MaintenanceTicket[]
  buildingContractors: BuildingContractor[]
  simulatedEmails: SimulatedEmail[]
  initialized: boolean
}

export type Screen =
  | 'landing'
  | 'signup'
  | 'login'
  | 'technician-login'
  | 'technician-portal'
  | 'admin-portal'
  | 'staff-portal'
  | 'resident-portal'

export interface BuildingPaymentSummary {
  buildingId: string
  period: string
  totalDue: number
  totalPaid: number
  totalPending: number
  invoiceCount: number
}

export interface RentStatusRow {
  apartmentId: string
  buildingId: string
  buildingName: string
  label: string
  leaseName: string
  status: RentStatus
  period: string
}
