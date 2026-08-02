import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from './LangContext'
import type {
  Apartment,
  AppData,
  Building,
  BuildingBankAccount,
  BuildingContractor,
  BuildingPaymentSummary,
  ChatMessage,
  ChatThread,
  Company,
  Invoice,
  MaintenanceTicket,
  PendingRegistration,
  RentStatus,
  RentStatusRow,
  SimulatedEmail,
  TicketCategory,
  TicketStatus,
  User,
} from '../types'
import { isBankConfigured } from '../lib/invoices'
import {
  addBankAccountForBuilding,
  ensureApartmentInvoice,
  ensureBuildingInvoices,
  getBuildingBankAccount,
  markInvoiceDue,
  markInvoicePaid,
  setBuildingBankAccount,
  submitInvoiceProof,
  upsertInvoice,
} from '../lib/paymentStore'
import { monthlyRentAmount } from '../lib/invoices'
import { assistantReply } from '../lib/assistantReply'
import {
  confirmCheckout,
  createCheckout,
  fetchAssistantReply,
  fetchCloudData,
  fetchServerConfig,
  saveCloudData,
  sendEmailApi,
  type ServerConfig,
} from '../lib/cloudApi'
import { currentRentPeriod } from '../lib/rentPeriod'
import { isCloudEnabled } from '../config/platform'
import { loadDataLocal, saveDataLocal } from '../lib/storage'
import { buildTicketAlertEmail } from '../lib/ticketNotify'
import {
  assignTicketContractor as assignTicketContractorStore,
  createMaintenanceTicket,
  getBuildingContractors as getBuildingContractorsStore,
  logTicketWhatsAppNotify as logTicketWhatsAppNotifyStore,
  removeBuildingContractor as removeBuildingContractorStore,
  updateTicketStatus as updateTicketStatusStore,
  upsertBuildingContractor,
} from '../lib/ticketStore'
import { PLATFORM } from '../config/platform'
import { apartmentLabels, generatePassword, nowIso, uid } from '../lib/utils'

interface DataContextValue {
  data: AppData
  ready: boolean
  cloudStatus: ServerConfig | null
  syncError: string | null
  refreshCloudData: () => Promise<void>
  submitRegistration: (input: {
    companyName: string
    adminName: string
    adminEmail: string
    phone?: string
  }) => { ok: boolean; error?: string }
  approveRegistration: (id: string) => { ok: boolean; password?: string; error?: string }
  rejectRegistration: (id: string) => { ok: boolean; error?: string }
  addBuilding: (
    companyId: string,
    input: { name: string; address: string; unitPrefix: string; apartmentCount: number },
  ) => Building | null
  updateBuilding: (
    buildingId: string,
    input: { name: string; address: string; unitPrefix: string; apartmentCount: number },
  ) => void
  removeBuilding: (buildingId: string) => void
  updateAdminProfile: (
    userId: string,
    input: { name: string; phone?: string; email: string },
  ) => { ok: boolean; error?: string }
  changePassword: (
    userId: string,
    current: string,
    next: string,
  ) => { ok: boolean; error?: string }
  assignResident: (
    apartmentId: string,
    input: {
      leaseName: string
      email: string
      leaseStart: string
      leaseEnd: string
      leaseAmount: number
    },
  ) => { ok: boolean; password?: string; error?: string }
  updateApartmentLease: (
    apartmentId: string,
    input: { leaseName: string; leaseStart: string; leaseEnd: string; leaseAmount: number },
  ) => { ok: boolean; error?: string }
  removeResident: (apartmentId: string) => void
  createStaff: (
    companyId: string,
    input: { name: string; email: string; phone?: string },
  ) => { ok: boolean; password?: string; error?: string }
  updateStaff: (
    userId: string,
    input: { name: string; email: string; phone?: string },
  ) => { ok: boolean; error?: string }
  removeStaff: (userId: string) => void
  getStaffForCompany: (companyId: string) => User[]
  setRentStatus: (apartmentId: string, period: string, status: RentStatus) => void
  getRentStatus: (apartmentId: string, period?: string) => RentStatus
  getRentStatusRows: (companyId: string, period?: string) => RentStatusRow[]
  getOrCreateThread: (residentUserId: string, lang: Lang) => ChatThread | null
  getThreadMessages: (threadId: string) => ChatMessage[]
  getCompanyThreads: (companyId: string) => ChatThread[]
  sendChatMessage: (
    threadId: string,
    sender: User,
    body: string,
    lang: Lang,
  ) => { ok: boolean; error?: string }
  requestStaffHandoff: (threadId: string, lang: Lang) => void
  assignThread: (threadId: string, staffUserId: string) => void
  getInvoiceForApartment: (apartmentId: string, period?: string) => Invoice | undefined
  ensureApartmentInvoiceNow: (apartmentId: string, period?: string) => Invoice | undefined
  getInvoicesForBuilding: (buildingId: string, period?: string) => Invoice[]
  getBuildingPaymentSummary: (buildingId: string, period?: string) => BuildingPaymentSummary
  getBuildingBankAccount: (buildingId: string) => BuildingBankAccount
  updateBuildingBankAccount: (
    buildingId: string,
    account: Omit<BuildingBankAccount, 'buildingId'>,
  ) => void
  ensureBuildingInvoices: (buildingId: string, period?: string) => void
  submitBankTransfer: (invoiceId: string, proofImage: string) => { ok: boolean; error?: string }
  payInvoiceOnline: (
    invoiceId: string,
    method: 'apple_pay' | 'card',
  ) => Promise<{ ok: boolean; error?: string; checkoutUrl?: string }>
  approveBankTransfer: (invoiceId: string, adminUserId: string) => void
  rejectBankTransfer: (invoiceId: string) => void
  createTicket: (
    residentUserId: string,
    input: { category: TicketCategory; title: string; description: string },
  ) => { ok: boolean; ticket?: MaintenanceTicket; error?: string }
  getTicketsForCompany: (companyId: string) => MaintenanceTicket[]
  getTicketsForResident: (residentUserId: string) => MaintenanceTicket[]
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void
  assignTicketContractor: (ticketId: string, contractorId: string | undefined) => void
  getBuildingContractors: (buildingId: string) => BuildingContractor[]
  saveBuildingContractor: (
    buildingId: string,
    input: { id?: string; category: TicketCategory; name: string; phone: string },
  ) => { ok: boolean; error?: string }
  removeBuildingContractor: (contractorId: string) => void
  logTicketWhatsAppNotify: (ticketId: string, userId: string) => void
  getCompany: (id: string) => Company | undefined
  getBuildingsForCompany: (companyId: string) => Building[]
  getApartmentsForBuilding: (buildingId: string) => Apartment[]
  findUserByEmail: (email: string) => User | undefined
  authenticate: (email: string, password: string, role?: User['role']) => User | null
}

const DataContext = createContext<DataContextValue | null>(null)

function syncApartments(
  data: AppData,
  building: Building,
  previousCount: number,
): AppData {
  const existing = data.apartments.filter((a) => a.buildingId === building.id)
  const labels = apartmentLabels(building.unitPrefix, building.apartmentCount)
  const others = data.apartments.filter((a) => a.buildingId !== building.id)

  if (building.apartmentCount >= previousCount) {
    const updated = labels.map((label, i) => {
      const apt = existing[i]
      if (apt) return { ...apt, label }
      return {
        id: uid('apt_'),
        companyId: building.companyId,
        buildingId: building.id,
        label,
        leaseName: '',
        leaseStart: '',
        leaseEnd: '',
        leaseAmount: 0,
        residentEmail: '',
      }
    })
    return { ...data, apartments: [...others, ...updated] }
  }

  const removedResidents = existing
    .slice(building.apartmentCount)
    .map((a) => a.residentUserId)
    .filter(Boolean) as string[]

  const updated = labels.map((label, i) => ({
    ...existing[i],
    label,
  }))

  return {
    ...data,
    users: data.users.filter((u) => !removedResidents.includes(u.id)),
    apartments: [...others, ...updated],
  }
}

function queueEmail(
  data: AppData,
  email: Omit<SimulatedEmail, 'id' | 'createdAt'>,
): AppData {
  return {
    ...data,
    simulatedEmails: [
      {
        ...email,
        id: uid('mail_'),
        createdAt: nowIso(),
      },
      ...data.simulatedEmails,
    ],
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadDataLocal())
  const [ready, setReady] = useState(!isCloudEnabled())
  const [cloudStatus, setCloudStatus] = useState<ServerConfig | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const refreshCloudData = useCallback(async () => {
    if (!isCloudEnabled()) return
    try {
      const remote = await fetchCloudData()
      saveDataLocal(remote)
      setData(remote)
      setSyncError(null)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'sync_failed')
    }
  }, [])

  useEffect(() => {
    if (!isCloudEnabled()) return

    let cancelled = false
    Promise.all([
      fetchCloudData().catch(() => loadDataLocal()),
      fetchServerConfig().catch(() => null),
    ]).then(([remoteData, config]) => {
      if (cancelled) return
      saveDataLocal(remoteData)
      setData(remoteData)
      setCloudStatus(config)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isCloudEnabled()) return

    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const sessionId = params.get('session_id')
    if (payment !== 'success' || !sessionId) return

    confirmCheckout(sessionId)
      .then(() => refreshCloudData())
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname)
      })
  }, [refreshCloudData])

  const persist = useCallback((next: AppData) => {
    saveDataLocal(next)
    setData(next)
    if (isCloudEnabled()) {
      saveCloudData(next).catch((error) => {
        setSyncError(error instanceof Error ? error.message : 'sync_failed')
      })
    }
  }, [])

  const dispatchEmail = useCallback((email: Omit<SimulatedEmail, 'id' | 'createdAt'>) => {
    if (isCloudEnabled()) {
      sendEmailApi(email).catch(() => undefined)
    }
  }, [])

  const queueEmailAndDispatch = useCallback(
    (base: AppData, email: Omit<SimulatedEmail, 'id' | 'createdAt'>): AppData => {
      dispatchEmail(email)
      return queueEmail(base, email)
    },
    [dispatchEmail],
  )

  const submitRegistration = useCallback(
    (input: {
      companyName: string
      adminName: string
      adminEmail: string
      phone?: string
    }) => {
      const email = input.adminEmail.trim().toLowerCase()
      if (!input.companyName.trim() || !input.adminName.trim() || !email) {
        return { ok: false, error: 'required' }
      }
      if (
        data.users.some((u) => u.email.toLowerCase() === email) ||
        data.pendingRegistrations.some(
          (r) => r.adminEmail.toLowerCase() === email && r.status === 'pending',
        )
      ) {
        return { ok: false, error: 'emailInUse' }
      }

      const registration: PendingRegistration = {
        id: uid('reg_'),
        companyName: input.companyName.trim(),
        adminName: input.adminName.trim(),
        adminEmail: email,
        phone: input.phone?.trim(),
        status: 'pending',
        createdAt: nowIso(),
      }

      let next = {
        ...data,
        pendingRegistrations: [registration, ...data.pendingRegistrations],
      }

      next = queueEmailAndDispatch(next, {
        to: 'technician@mlihrent.app',
        subject: `New company registration: ${registration.companyName}`,
        body: `A new company requested access.\n\nCompany: ${registration.companyName}\nAdmin: ${registration.adminName}\nEmail: ${registration.adminEmail}\nPhone: ${registration.phone ?? '—'}\n\nReview in the technician panel.`,
        kind: 'technician_alert',
      })

      persist(next)
      return { ok: true }
    },
    [data, persist],
  )

  const approveRegistration = useCallback(
    (id: string) => {
      const reg = data.pendingRegistrations.find((r) => r.id === id && r.status === 'pending')
      if (!reg) return { ok: false, error: 'not_found' }

      const password = generatePassword()
      const company: Company = {
        id: uid('co_'),
        name: reg.companyName,
        createdAt: nowIso(),
        active: true,
      }
      const admin: User = {
        id: uid('usr_'),
        companyId: company.id,
        role: 'admin',
        email: reg.adminEmail,
        password,
        name: reg.adminName,
        phone: reg.phone,
        createdAt: nowIso(),
      }

      let next: AppData = {
        ...data,
        companies: [company, ...data.companies],
        users: [...data.users, admin],
        pendingRegistrations: data.pendingRegistrations.map((r) =>
          r.id === id ? { ...r, status: 'approved' as const, reviewedAt: nowIso() } : r,
        ),
      }

      next = queueEmailAndDispatch(next, {
        to: reg.adminEmail,
        subject: 'MlihRent — your company account is approved',
        body: `Welcome to MlihRent!\n\nYour company "${reg.companyName}" has been approved.\n\nLogin email: ${reg.adminEmail}\nTemporary password: ${password}\n\nPlease log in and change your password in your profile.`,
        kind: 'approval',
      })

      persist(next)
      return { ok: true, password }
    },
    [data, persist],
  )

  const rejectRegistration = useCallback(
    (id: string) => {
      const reg = data.pendingRegistrations.find((r) => r.id === id && r.status === 'pending')
      if (!reg) return { ok: false, error: 'not_found' }

      let next: AppData = {
        ...data,
        pendingRegistrations: data.pendingRegistrations.map((r) =>
          r.id === id ? { ...r, status: 'rejected' as const, reviewedAt: nowIso() } : r,
        ),
      }

      next = queueEmailAndDispatch(next, {
        to: reg.adminEmail,
        subject: 'MlihRent — registration update',
        body: `Thank you for your interest in MlihRent.\n\nYour registration for "${reg.companyName}" was not approved at this time. Contact support if you have questions.`,
        kind: 'rejection',
      })

      persist(next)
      return { ok: true }
    },
    [data, persist],
  )

  const addBuilding = useCallback(
    (
      companyId: string,
      input: { name: string; address: string; unitPrefix: string; apartmentCount: number },
    ) => {
      const building: Building = {
        id: uid('bld_'),
        companyId,
        name: input.name.trim(),
        address: input.address.trim(),
        unitPrefix: input.unitPrefix.trim() || 'A',
        apartmentCount: Math.max(1, input.apartmentCount),
        createdAt: nowIso(),
      }

      let next = { ...data, buildings: [building, ...data.buildings] }
      next = syncApartments(next, building, 0)
      next = addBankAccountForBuilding(next, building.id)
      persist(next)
      return building
    },
    [data, persist],
  )

  const updateBuilding = useCallback(
    (
      buildingId: string,
      input: { name: string; address: string; unitPrefix: string; apartmentCount: number },
    ) => {
      const building = data.buildings.find((b) => b.id === buildingId)
      if (!building) return

      const previousCount = building.apartmentCount
      const updated: Building = {
        ...building,
        name: input.name.trim(),
        address: input.address.trim(),
        unitPrefix: input.unitPrefix.trim() || 'A',
        apartmentCount: Math.max(1, input.apartmentCount),
      }

      let next = {
        ...data,
        buildings: data.buildings.map((b) => (b.id === buildingId ? updated : b)),
      }
      next = syncApartments(next, updated, previousCount)
      persist(next)
    },
    [data, persist],
  )

  const removeBuilding = useCallback(
    (buildingId: string) => {
      const residentIds = data.apartments
        .filter((a) => a.buildingId === buildingId)
        .map((a) => a.residentUserId)
        .filter(Boolean) as string[]

      persist({
        ...data,
        buildings: data.buildings.filter((b) => b.id !== buildingId),
        apartments: data.apartments.filter((a) => a.buildingId !== buildingId),
        users: data.users.filter((u) => !residentIds.includes(u.id)),
        invoices: data.invoices.filter((i) => i.buildingId !== buildingId),
        rentRecords: data.rentRecords.filter((r) => r.buildingId !== buildingId),
        buildingBankAccounts: data.buildingBankAccounts.filter(
          (b) => b.buildingId !== buildingId,
        ),
        maintenanceTickets: data.maintenanceTickets.filter((t) => t.buildingId !== buildingId),
        buildingContractors: data.buildingContractors.filter((c) => c.buildingId !== buildingId),
      })
    },
    [data, persist],
  )

  const updateAdminProfile = useCallback(
    (userId: string, input: { name: string; phone?: string; email: string }) => {
      const email = input.email.trim().toLowerCase()
      const user = data.users.find((u) => u.id === userId)
      if (!user) return { ok: false, error: 'not_found' }
      if (
        data.users.some(
          (u) => u.id !== userId && u.email.toLowerCase() === email,
        )
      ) {
        return { ok: false, error: 'emailInUse' }
      }

      persist({
        ...data,
        users: data.users.map((u) =>
          u.id === userId
            ? { ...u, name: input.name.trim(), phone: input.phone?.trim(), email }
            : u,
        ),
      })
      return { ok: true }
    },
    [data, persist],
  )

  const changePassword = useCallback(
    (userId: string, current: string, next: string) => {
      const user = data.users.find((u) => u.id === userId)
      if (!user || user.password !== current) {
        return { ok: false, error: 'invalidLogin' }
      }
      persist({
        ...data,
        users: data.users.map((u) => (u.id === userId ? { ...u, password: next } : u)),
      })
      return { ok: true }
    },
    [data, persist],
  )

  const assignResident = useCallback(
    (apartmentId: string, input: {
      leaseName: string
      email: string
      leaseStart: string
      leaseEnd: string
      leaseAmount: number
    }) => {
      const apt = data.apartments.find((a) => a.id === apartmentId)
      if (!apt) return { ok: false, error: 'not_found' }
      const email = input.email.trim().toLowerCase()
      if (!input.leaseName.trim() || !email || !input.leaseStart || !input.leaseEnd) {
        return { ok: false, error: 'required' }
      }
      if (input.leaseAmount <= 0) return { ok: false, error: 'required' }
      if (input.leaseEnd < input.leaseStart) {
        return { ok: false, error: 'leaseDateOrder' }
      }
      if (data.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'emailInUse' }
      }

      const password = generatePassword()
      const resident: User = {
        id: uid('usr_'),
        companyId: apt.companyId,
        role: 'resident',
        email,
        password,
        name: input.leaseName.trim(),
        createdAt: nowIso(),
      }

      let next: AppData = {
        ...data,
        users: [...data.users, resident],
        apartments: data.apartments.map((a) =>
          a.id === apartmentId
            ? {
                ...a,
                leaseName: input.leaseName.trim(),
                leaseStart: input.leaseStart,
                leaseEnd: input.leaseEnd,
                leaseAmount: input.leaseAmount,
                residentEmail: email,
                residentUserId: resident.id,
              }
            : a,
        ),
      }

      next = queueEmailAndDispatch(next, {
        to: email,
        subject: 'MlihRent — your resident account',
        body: `Welcome!\n\nYour apartment account is ready.\n\nLogin email: ${email}\nTemporary password: ${password}\n\nLease: ${input.leaseStart} to ${input.leaseEnd}\nFull lease amount: ${input.leaseAmount} AED\n\nYou can change your password after logging in. Other profile details are managed by your building admin.`,
        kind: 'approval',
      })

      const ensured = ensureApartmentInvoice(next, apartmentId, currentRentPeriod())
      persist(ensured.data)
      return { ok: true, password }
    },
    [data, persist],
  )

  const updateApartmentLease = useCallback(
    (apartmentId: string, input: {
      leaseName: string
      leaseStart: string
      leaseEnd: string
      leaseAmount: number
    }) => {
      const apt = data.apartments.find((a) => a.id === apartmentId)
      if (!apt?.residentUserId) return { ok: false, error: 'not_found' }
      if (!input.leaseName.trim() || !input.leaseStart || !input.leaseEnd) {
        return { ok: false, error: 'required' }
      }
      if (input.leaseAmount <= 0) return { ok: false, error: 'required' }
      if (input.leaseEnd < input.leaseStart) {
        return { ok: false, error: 'leaseDateOrder' }
      }

      const updatedApt: Apartment = {
        ...apt,
        leaseName: input.leaseName.trim(),
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        leaseAmount: input.leaseAmount,
      }

      let next: AppData = {
        ...data,
        apartments: data.apartments.map((a) => (a.id === apartmentId ? updatedApt : a)),
        users: data.users.map((u) =>
          u.id === apt.residentUserId ? { ...u, name: input.leaseName.trim() } : u,
        ),
      }

      const period = currentRentPeriod()
      const invoice = next.invoices.find(
        (i) => i.apartmentId === apartmentId && i.period === period,
      )
      if (invoice) {
        next = upsertInvoice(next, {
          ...invoice,
          amount: monthlyRentAmount(updatedApt),
          updatedAt: nowIso(),
        })
      }

      persist(next)
      return { ok: true }
    },
    [data, persist],
  )

  const removeResident = useCallback(
    (apartmentId: string) => {
      const apt = data.apartments.find((a) => a.id === apartmentId)
      if (!apt?.residentUserId) return

      const threadIds = data.chatThreads
        .filter((t) => t.residentUserId === apt.residentUserId)
        .map((t) => t.id)

      persist({
        ...data,
        users: data.users.filter((u) => u.id !== apt.residentUserId),
        apartments: data.apartments.map((a) =>
          a.id === apartmentId
            ? { ...a, leaseName: '', leaseStart: '', leaseEnd: '', leaseAmount: 0, residentEmail: '', residentUserId: undefined }
            : a,
        ),
        invoices: data.invoices.filter((i) => i.apartmentId !== apartmentId),
        rentRecords: data.rentRecords.filter((r) => r.apartmentId !== apartmentId),
        chatThreads: data.chatThreads.filter((t) => !threadIds.includes(t.id)),
        chatMessages: data.chatMessages.filter((m) => !threadIds.includes(m.threadId)),
      })
    },
    [data, persist],
  )

  const createStaff = useCallback(
    (companyId: string, input: { name: string; email: string; phone?: string }) => {
      const email = input.email.trim().toLowerCase()
      if (!input.name.trim() || !email) return { ok: false, error: 'required' }
      if (data.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'emailInUse' }
      }

      const password = generatePassword()
      const staff: User = {
        id: uid('usr_'),
        companyId,
        role: 'staff',
        email,
        password,
        name: input.name.trim(),
        phone: input.phone?.trim(),
        createdAt: nowIso(),
      }

      let next: AppData = { ...data, users: [...data.users, staff] }
      next = queueEmailAndDispatch(next, {
        to: email,
        subject: 'MlihRent — your staff account',
        body: `Welcome to MlihRent support staff.\n\nLogin email: ${email}\nTemporary password: ${password}\n\nUse Staff login on the website. You can change your password after logging in.`,
        kind: 'staff_welcome',
      })

      persist(next)
      return { ok: true, password }
    },
    [data, persist],
  )

  const updateStaff = useCallback(
    (userId: string, input: { name: string; email: string; phone?: string }) => {
      const email = input.email.trim().toLowerCase()
      if (data.users.some((u) => u.id !== userId && u.email.toLowerCase() === email)) {
        return { ok: false, error: 'emailInUse' }
      }
      persist({
        ...data,
        users: data.users.map((u) =>
          u.id === userId && u.role === 'staff'
            ? { ...u, name: input.name.trim(), email, phone: input.phone?.trim() }
            : u,
        ),
      })
      return { ok: true }
    },
    [data, persist],
  )

  const removeStaff = useCallback(
    (userId: string) => {
      persist({
        ...data,
        users: data.users.filter((u) => u.id !== userId),
        chatThreads: data.chatThreads.map((t) =>
          t.assignedStaffId === userId ? { ...t, assignedStaffId: undefined } : t,
        ),
      })
    },
    [data, persist],
  )

  const setRentStatus = useCallback(
    (apartmentId: string, period: string, status: RentStatus) => {
      const ensured = ensureApartmentInvoice(data, apartmentId, period)
      const invoice = ensured.invoice
      if (!invoice) return
      const next =
        status === 'paid'
          ? markInvoicePaid(ensured.data, invoice.id, 'manual')
          : markInvoiceDue(ensured.data, invoice.id)
      persist(next)
    },
    [data, persist],
  )

  const getRentStatus = useCallback(
    (apartmentId: string, period = currentRentPeriod()): RentStatus => {
      const invoice = data.invoices.find(
        (i) => i.apartmentId === apartmentId && i.period === period,
      )
      if (invoice) return invoice.status === 'paid' ? 'paid' : 'unpaid'
      const record = data.rentRecords.find(
        (r) => r.apartmentId === apartmentId && r.period === period,
      )
      return record?.status ?? 'unpaid'
    },
    [data.invoices, data.rentRecords],
  )

  const getRentStatusRows = useCallback(
    (companyId: string, period = currentRentPeriod()): RentStatusRow[] => {
      const buildings = data.buildings.filter((b) => b.companyId === companyId)
      const buildingMap = new Map(buildings.map((b) => [b.id, b.name]))

      return data.apartments
        .filter((a) => a.companyId === companyId && a.residentUserId)
        .map((apt) => ({
          apartmentId: apt.id,
          buildingId: apt.buildingId,
          buildingName: buildingMap.get(apt.buildingId) ?? '—',
          label: apt.label,
          leaseName: apt.leaseName,
          status: getRentStatus(apt.id, period),
          period,
        }))
        .sort((a, b) =>
          `${a.buildingName}${a.label}`.localeCompare(`${b.buildingName}${b.label}`),
        )
    },
    [data.apartments, data.buildings, getRentStatus],
  )

  const getOrCreateThread = useCallback(
    (residentUserId: string, lang: Lang): ChatThread | null => {
      const existing = data.chatThreads.find((t) => t.residentUserId === residentUserId)
      if (existing) return existing

      const resident = data.users.find((u) => u.id === residentUserId)
      const apartment = data.apartments.find((a) => a.residentUserId === residentUserId)
      if (!resident?.companyId || !apartment) return null

      const thread: ChatThread = {
        id: uid('thread_'),
        companyId: resident.companyId,
        residentUserId,
        apartmentId: apartment.id,
        status: 'ai',
        updatedAt: nowIso(),
        createdAt: nowIso(),
      }

      const welcome: ChatMessage = {
        id: uid('msg_'),
        threadId: thread.id,
        senderRole: 'ai',
        body:
          lang === 'ar'
            ? 'مرحباً! أنا مساعد MlihRent. اسأل عن الإيجار أو شقتك، أو اطلب التحدث مع موظف.'
            : 'Hello! I am the MlihRent assistant. Ask about rent or your apartment, or request a staff member.',
        createdAt: nowIso(),
      }

      persist({
        ...data,
        chatThreads: [thread, ...data.chatThreads],
        chatMessages: [...data.chatMessages, welcome],
      })

      return thread
    },
    [data, persist],
  )

  const getThreadMessages = useCallback(
    (threadId: string) =>
      data.chatMessages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data.chatMessages],
  )

  const getCompanyThreads = useCallback(
    (companyId: string) =>
      [...data.chatThreads]
        .filter((t) => t.companyId === companyId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.chatThreads],
  )

  const appendMessage = (base: AppData, message: ChatMessage, thread: ChatThread): AppData => ({
    ...base,
    chatMessages: [...base.chatMessages, message],
    chatThreads: base.chatThreads.map((t) =>
      t.id === thread.id ? { ...t, updatedAt: nowIso() } : t,
    ),
  })

  const applyAssistantReply = useCallback(
    (threadId: string, lang: Lang, reply: { body: string; escalate: boolean }) => {
      setData((current) => {
        const thread = current.chatThreads.find((t) => t.id === threadId)
        if (!thread) return current

        let next = current
        const aiMessage: ChatMessage = {
          id: uid('msg_'),
          threadId,
          senderRole: 'ai',
          body: reply.body,
          createdAt: nowIso(),
        }
        next = appendMessage(next, aiMessage, thread)

        if (reply.escalate) {
          const systemMessage: ChatMessage = {
            id: uid('msg_'),
            threadId,
            senderRole: 'system',
            body:
              lang === 'ar'
                ? 'تم تحويل المحادثة إلى موظف الدعم.'
                : 'This chat was transferred to support staff.',
            createdAt: nowIso(),
          }
          next = appendMessage(next, systemMessage, thread)
          next = {
            ...next,
            chatThreads: next.chatThreads.map((t) =>
              t.id === threadId ? { ...t, status: 'staff', updatedAt: nowIso() } : t,
            ),
          }
        }

        saveDataLocal(next)
        if (isCloudEnabled()) {
          saveCloudData(next).catch((error) => {
            setSyncError(error instanceof Error ? error.message : 'sync_failed')
          })
        }
        return next
      })
    },
    [],
  )

  const sendChatMessage = useCallback(
    (threadId: string, sender: User, body: string, lang: Lang) => {
      const trimmed = body.trim()
      if (!trimmed) return { ok: false, error: 'required' }

      const thread = data.chatThreads.find((t) => t.id === threadId)
      if (!thread) return { ok: false, error: 'not_found' }

      let next = data
      const residentMessage: ChatMessage = {
        id: uid('msg_'),
        threadId,
        senderRole: sender.role === 'staff' ? 'staff' : 'resident',
        senderUserId: sender.id,
        body: trimmed,
        createdAt: nowIso(),
      }
      next = appendMessage(next, residentMessage, thread)

      if (sender.role === 'staff') {
        next = {
          ...next,
          chatThreads: next.chatThreads.map((t) =>
            t.id === threadId
              ? { ...t, status: 'staff', assignedStaffId: sender.id, updatedAt: nowIso() }
              : t,
          ),
        }
      }

      persist(next)

      if (sender.role === 'resident' && thread.status === 'ai') {
        if (isCloudEnabled()) {
          fetchAssistantReply(trimmed, lang)
            .then((reply) => applyAssistantReply(threadId, lang, reply))
            .catch(() => applyAssistantReply(threadId, lang, assistantReply(trimmed, lang)))
        } else {
          applyAssistantReply(threadId, lang, assistantReply(trimmed, lang))
        }
      }

      return { ok: true }
    },
    [data, persist, applyAssistantReply],
  )

  const requestStaffHandoff = useCallback(
    (threadId: string, lang: Lang) => {
      const thread = data.chatThreads.find((t) => t.id === threadId)
      if (!thread || thread.status === 'staff') return

      const systemMessage: ChatMessage = {
        id: uid('msg_'),
        threadId,
        senderRole: 'system',
        body:
          lang === 'ar'
            ? 'تم تحويل المحادثة إلى موظف الدعم.'
            : 'This chat was transferred to support staff.',
        createdAt: nowIso(),
      }

      let next = appendMessage(data, systemMessage, thread)
      next = {
        ...next,
        chatThreads: next.chatThreads.map((t) =>
          t.id === threadId ? { ...t, status: 'staff', updatedAt: nowIso() } : t,
        ),
      }
      persist(next)
    },
    [data, persist],
  )

  const assignThread = useCallback(
    (threadId: string, staffUserId: string) => {
      persist({
        ...data,
        chatThreads: data.chatThreads.map((t) =>
          t.id === threadId
            ? { ...t, assignedStaffId: staffUserId, status: 'staff', updatedAt: nowIso() }
            : t,
        ),
      })
    },
    [data, persist],
  )

  const getInvoiceForApartment = useCallback(
    (apartmentId: string, period = currentRentPeriod()) =>
      data.invoices.find((i) => i.apartmentId === apartmentId && i.period === period),
    [data.invoices],
  )

  const ensureApartmentInvoiceNow = useCallback(
    (apartmentId: string, period = currentRentPeriod()) => {
      const result = ensureApartmentInvoice(data, apartmentId, period)
      if (result.data !== data) persist(result.data)
      return result.invoice
    },
    [data, persist],
  )

  const getInvoicesForBuilding = useCallback(
    (buildingId: string, period = currentRentPeriod()) =>
      data.invoices
        .filter((i) => i.buildingId === buildingId && i.period === period)
        .sort((a, b) => a.reference.localeCompare(b.reference)),
    [data.invoices],
  )

  const getBuildingPaymentSummary = useCallback(
    (buildingId: string, period = currentRentPeriod()): BuildingPaymentSummary => {
      const invoices = data.invoices.filter(
        (i) => i.buildingId === buildingId && i.period === period,
      )
      return {
        buildingId,
        period,
        totalDue: invoices.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount, 0),
        totalPending: invoices
          .filter((i) => i.status === 'pending_review')
          .reduce((s, i) => s + i.amount, 0),
        totalPaid: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
        invoiceCount: invoices.length,
      }
    },
    [data.invoices],
  )

  const updateBuildingBankAccount = useCallback(
    (buildingId: string, account: Omit<BuildingBankAccount, 'buildingId'>) => {
      persist(
        setBuildingBankAccount(data, {
          buildingId,
          ...account,
        }),
      )
    },
    [data, persist],
  )

  const ensureBuildingInvoicesFn = useCallback(
    (buildingId: string, period = currentRentPeriod()) => {
      persist(ensureBuildingInvoices(data, buildingId, period))
    },
    [data, persist],
  )

  const submitBankTransfer = useCallback(
    (invoiceId: string, proofImage: string) => {
      if (!proofImage) return { ok: false, error: 'required' }
      const invoice = data.invoices.find((i) => i.id === invoiceId)
      if (!invoice) return { ok: false, error: 'not_found' }
      if (invoice.status === 'paid') return { ok: false, error: 'already_paid' }
      const bank = getBuildingBankAccount(data, invoice.buildingId)
      if (!isBankConfigured(bank)) return { ok: false, error: 'bank_not_configured' }
      persist(submitInvoiceProof(data, invoiceId, proofImage))
      return { ok: true }
    },
    [data, persist],
  )

  const payInvoiceOnline = useCallback(
    async (invoiceId: string, method: 'apple_pay' | 'card') => {
      const invoice = data.invoices.find((i) => i.id === invoiceId)
      if (!invoice) return { ok: false, error: 'not_found' }
      if (invoice.status === 'paid') return { ok: false, error: 'already_paid' }

      if (isCloudEnabled()) {
        try {
          const result = await createCheckout(invoiceId, method)
          if (result.url) return { ok: true, checkoutUrl: result.url }
          if (result.ok && result.simulated) {
            persist(markInvoicePaid(data, invoiceId, method))
            return { ok: true }
          }
          return { ok: false, error: result.error ?? 'payment_failed' }
        } catch {
          return { ok: false, error: 'payment_failed' }
        }
      }

      persist(markInvoicePaid(data, invoiceId, method))
      return { ok: true }
    },
    [data, persist],
  )

  const approveBankTransfer = useCallback(
    (invoiceId: string, adminUserId: string) => {
      persist(markInvoicePaid(data, invoiceId, 'bank_transfer', adminUserId))
    },
    [data, persist],
  )

  const rejectBankTransfer = useCallback(
    (invoiceId: string) => {
      persist(markInvoiceDue(data, invoiceId))
    },
    [data, persist],
  )

  const createTicket = useCallback(
    (
      residentUserId: string,
      input: { category: TicketCategory; title: string; description: string },
    ) => {
      if (!input.title.trim() || !input.description.trim()) {
        return { ok: false, error: 'required' }
      }
      const apartment = data.apartments.find((a) => a.residentUserId === residentUserId)
      if (!apartment) return { ok: false, error: 'no_apartment' }
      const building = data.buildings.find((b) => b.id === apartment.buildingId)
      if (!building) return { ok: false, error: 'no_building' }

      const result = createMaintenanceTicket(data, {
        companyId: apartment.companyId,
        buildingId: apartment.buildingId,
        apartmentId: apartment.id,
        residentUserId,
        buildingName: building.name,
        unitLabel: apartment.label,
        category: input.category,
        title: input.title,
        description: input.description,
      })

      const ticket = result.ticket
      const company = data.companies.find((c) => c.id === ticket.companyId)
      const resident = data.users.find((u) => u.id === residentUserId)
      const admin = data.users.find(
        (u) => u.companyId === ticket.companyId && u.role === 'admin',
      )
      const staff = data.users.filter(
        (u) => u.companyId === ticket.companyId && u.role === 'staff',
      )
      const emailContent = buildTicketAlertEmail({
        ticket,
        building,
        unitLabel: apartment.label,
        resident,
        companyName: company?.name ?? 'Company',
      })

      let next = result.data
      if (admin) {
        next = queueEmailAndDispatch(next, {
          to: admin.email,
          subject: emailContent.subject,
          body: emailContent.body,
          kind: 'ticket_alert',
        })
      }
      for (const member of staff) {
        next = queueEmailAndDispatch(next, {
          to: member.email,
          subject: emailContent.subject,
          body: emailContent.body,
          kind: 'ticket_alert',
        })
      }
      next = queueEmailAndDispatch(next, {
        to: PLATFORM.technicianEmail,
        subject: `[${company?.name ?? 'Company'}] ${emailContent.subject}`,
        body: emailContent.body,
        kind: 'ticket_alert',
      })

      persist(next)
      return { ok: true, ticket }
    },
    [data, persist],
  )

  const getTicketsForCompany = useCallback(
    (companyId: string) =>
      data.maintenanceTickets
        .filter((t) => t.companyId === companyId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.maintenanceTickets],
  )

  const getTicketsForResident = useCallback(
    (residentUserId: string) =>
      data.maintenanceTickets
        .filter((t) => t.residentUserId === residentUserId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.maintenanceTickets],
  )

  const updateTicketStatusFn = useCallback(
    (ticketId: string, status: TicketStatus) => {
      persist(updateTicketStatusStore(data, ticketId, status))
    },
    [data, persist],
  )

  const assignTicketContractorFn = useCallback(
    (ticketId: string, contractorId: string | undefined) => {
      persist(assignTicketContractorStore(data, ticketId, contractorId))
    },
    [data, persist],
  )

  const getBuildingContractorsFn = useCallback(
    (buildingId: string) => getBuildingContractorsStore(data, buildingId),
    [data.buildingContractors],
  )

  const saveBuildingContractor = useCallback(
    (
      buildingId: string,
      input: { id?: string; category: TicketCategory; name: string; phone: string },
    ) => {
      if (!input.name.trim() || !input.phone.trim()) {
        return { ok: false, error: 'required' }
      }
      const contractor: BuildingContractor = {
        id: input.id ?? uid('ctr_'),
        buildingId,
        category: input.category,
        name: input.name.trim(),
        phone: input.phone.trim(),
      }
      persist(upsertBuildingContractor(data, contractor))
      return { ok: true }
    },
    [data, persist],
  )

  const removeBuildingContractorFn = useCallback(
    (contractorId: string) => {
      persist(removeBuildingContractorStore(data, contractorId))
    },
    [data, persist],
  )

  const logTicketWhatsAppNotify = useCallback(
    (ticketId: string, userId: string) => {
      persist(logTicketWhatsAppNotifyStore(data, ticketId, userId))
    },
    [data, persist],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      ready,
      cloudStatus,
      syncError,
      refreshCloudData,
      submitRegistration,
      approveRegistration,
      rejectRegistration,
      addBuilding,
      updateBuilding,
      removeBuilding,
      updateAdminProfile,
      changePassword,
      assignResident,
      updateApartmentLease,
      removeResident,
      createStaff,
      updateStaff,
      removeStaff,
      getStaffForCompany: (companyId) =>
        data.users.filter((u) => u.companyId === companyId && u.role === 'staff'),
      setRentStatus,
      getRentStatus,
      getRentStatusRows,
      getOrCreateThread,
      getThreadMessages,
      getCompanyThreads,
      sendChatMessage,
      requestStaffHandoff,
      assignThread,
      getInvoiceForApartment,
      ensureApartmentInvoiceNow,
      getInvoicesForBuilding,
      getBuildingPaymentSummary,
      getBuildingBankAccount: (buildingId) => getBuildingBankAccount(data, buildingId),
      updateBuildingBankAccount,
      ensureBuildingInvoices: ensureBuildingInvoicesFn,
      submitBankTransfer,
      payInvoiceOnline,
      approveBankTransfer,
      rejectBankTransfer,
      createTicket,
      getTicketsForCompany,
      getTicketsForResident,
      updateTicketStatus: updateTicketStatusFn,
      assignTicketContractor: assignTicketContractorFn,
      getBuildingContractors: getBuildingContractorsFn,
      saveBuildingContractor,
      removeBuildingContractor: removeBuildingContractorFn,
      logTicketWhatsAppNotify,
      getCompany: (id) => data.companies.find((c) => c.id === id),
      getBuildingsForCompany: (companyId) =>
        data.buildings.filter((b) => b.companyId === companyId),
      getApartmentsForBuilding: (buildingId) =>
        data.apartments.filter((a) => a.buildingId === buildingId),
      findUserByEmail: (email) =>
        data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
      authenticate: (email, password, role) => {
        const user = data.users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            (role ? u.role === role : true),
        )
        return user ?? null
      },
    }),
    [
      data,
      ready,
      cloudStatus,
      syncError,
      refreshCloudData,
      submitRegistration,
      approveRegistration,
      rejectRegistration,
      addBuilding,
      updateBuilding,
      removeBuilding,
      updateAdminProfile,
      changePassword,
      assignResident,
      updateApartmentLease,
      removeResident,
      createStaff,
      updateStaff,
      removeStaff,
      setRentStatus,
      getRentStatus,
      getRentStatusRows,
      getOrCreateThread,
      getThreadMessages,
      getCompanyThreads,
      sendChatMessage,
      requestStaffHandoff,
      assignThread,
      getInvoiceForApartment,
      ensureApartmentInvoiceNow,
      getInvoicesForBuilding,
      getBuildingPaymentSummary,
      updateBuildingBankAccount,
      ensureBuildingInvoicesFn,
      submitBankTransfer,
      payInvoiceOnline,
      approveBankTransfer,
      rejectBankTransfer,
      createTicket,
      getTicketsForCompany,
      getTicketsForResident,
      updateTicketStatusFn,
      assignTicketContractorFn,
      getBuildingContractorsFn,
      saveBuildingContractor,
      removeBuildingContractorFn,
      logTicketWhatsAppNotify,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
