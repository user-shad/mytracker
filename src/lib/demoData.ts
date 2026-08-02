import type { AppData } from '../types'
import { invoiceReference } from './invoices'
import { currentRentPeriod } from './rentPeriod'
import { nowIso } from './utils'

export const DEMO_COMPANY_ID = 'demo_alnoor_co'

export const DEMO_LOGINS = {
  admin: { email: 'admin@demo.mlihrent', password: 'DemoAdmin2026!', name: 'Sara Al Mazrouei' },
  staff: { email: 'staff@demo.mlihrent', password: 'DemoStaff2026!', name: 'Fatima Al Ketbi' },
  staff2: { email: 'support@demo.mlihrent', password: 'DemoStaff2026!', name: 'Omar Al Mansoori' },
  resident: { email: 'resident@demo.mlihrent', password: 'DemoResident2026!', name: 'Ahmed Ali' },
  resident2: { email: 'mariam@demo.mlihrent', password: 'DemoResident2026!', name: 'Mariam Hassan' },
  resident3: { email: 'khalid@demo.mlihrent', password: 'DemoResident2026!', name: 'Khalid Omar' },
} as const

const IDS = {
  company: DEMO_COMPANY_ID,
  admin: 'demo_admin_user',
  staff1: 'demo_staff_user1',
  staff2: 'demo_staff_user2',
  resident1: 'demo_resident_user1',
  resident2: 'demo_resident_user2',
  resident3: 'demo_resident_user3',
  buildingA: 'demo_building_a',
  buildingB: 'demo_building_b',
  aptA1: 'demo_apt_a1',
  aptA2: 'demo_apt_a2',
  aptA3: 'demo_apt_a3',
  aptA4: 'demo_apt_a4',
  aptB1: 'demo_apt_b1',
  aptB2: 'demo_apt_b2',
  aptB3: 'demo_apt_b3',
  ctrPlumbA: 'demo_ctr_plumb_a',
  ctrElecA: 'demo_ctr_elec_a',
  ctrHvacB: 'demo_ctr_hvac_b',
  ctrGenB: 'demo_ctr_gen_b',
  ticket1: 'demo_ticket_1',
  ticket2: 'demo_ticket_2',
  ticket3: 'demo_ticket_3',
  thread1: 'demo_thread_1',
  thread2: 'demo_thread_2',
  pendingReg: 'demo_pending_reg',
} as const

export function isDemoLoaded(data: AppData): boolean {
  return data.companies.some((company) => company.id === DEMO_COMPANY_ID)
}

export function stripDemoData(existing: AppData): AppData {
  const demoThreadIds = existing.chatThreads
    .filter((thread) => thread.companyId === DEMO_COMPANY_ID)
    .map((thread) => thread.id)

  return {
    ...existing,
    pendingRegistrations: existing.pendingRegistrations.filter((reg) => reg.id !== IDS.pendingReg),
    companies: existing.companies.filter((company) => company.id !== DEMO_COMPANY_ID),
    users: existing.users.filter((user) => user.companyId !== DEMO_COMPANY_ID),
    buildings: existing.buildings.filter((building) => building.companyId !== DEMO_COMPANY_ID),
    apartments: existing.apartments.filter((apartment) => apartment.companyId !== DEMO_COMPANY_ID),
    rentRecords: existing.rentRecords.filter((record) => record.companyId !== DEMO_COMPANY_ID),
    invoices: existing.invoices.filter((invoice) => invoice.companyId !== DEMO_COMPANY_ID),
    buildingBankAccounts: existing.buildingBankAccounts.filter((account) => {
      const building = existing.buildings.find((item) => item.id === account.buildingId)
      return building?.companyId !== DEMO_COMPANY_ID
    }),
    chatThreads: existing.chatThreads.filter((thread) => thread.companyId !== DEMO_COMPANY_ID),
    chatMessages: existing.chatMessages.filter((message) => !demoThreadIds.includes(message.threadId)),
    maintenanceTickets: existing.maintenanceTickets.filter(
      (ticket) => ticket.companyId !== DEMO_COMPANY_ID,
    ),
    buildingContractors: existing.buildingContractors.filter((contractor) => {
      const building = existing.buildings.find((item) => item.id === contractor.buildingId)
      return building?.companyId !== DEMO_COMPANY_ID
    }),
    simulatedEmails: existing.simulatedEmails,
    initialized: existing.initialized,
  }
}

export function buildDemoData(existing: AppData): AppData {
  const base = stripDemoData(existing)
  const period = currentRentPeriod()
  const created = '2026-01-15T08:00:00.000Z'
  const now = nowIso()

  const company = {
    id: IDS.company,
    name: 'Al Noor Property Management',
    createdAt: created,
    active: true,
  }

  const admin = {
    id: IDS.admin,
    companyId: IDS.company,
    role: 'admin' as const,
    email: DEMO_LOGINS.admin.email,
    password: DEMO_LOGINS.admin.password,
    name: DEMO_LOGINS.admin.name,
    phone: '+971 50 111 2233',
    createdAt: created,
  }

  const staff1 = {
    id: IDS.staff1,
    companyId: IDS.company,
    role: 'staff' as const,
    email: DEMO_LOGINS.staff.email,
    password: DEMO_LOGINS.staff.password,
    name: DEMO_LOGINS.staff.name,
    phone: '+971 50 222 3344',
    createdAt: created,
  }

  const staff2 = {
    id: IDS.staff2,
    companyId: IDS.company,
    role: 'staff' as const,
    email: DEMO_LOGINS.staff2.email,
    password: DEMO_LOGINS.staff2.password,
    name: DEMO_LOGINS.staff2.name,
    phone: '+971 50 333 4455',
    createdAt: created,
  }

  const resident1 = {
    id: IDS.resident1,
    companyId: IDS.company,
    role: 'resident' as const,
    email: DEMO_LOGINS.resident.email,
    password: DEMO_LOGINS.resident.password,
    name: DEMO_LOGINS.resident.name,
    phone: '+971 50 444 5566',
    createdAt: created,
  }

  const resident2 = {
    id: IDS.resident2,
    companyId: IDS.company,
    role: 'resident' as const,
    email: DEMO_LOGINS.resident2.email,
    password: DEMO_LOGINS.resident2.password,
    name: DEMO_LOGINS.resident2.name,
    phone: '+971 50 555 6677',
    createdAt: created,
  }

  const resident3 = {
    id: IDS.resident3,
    companyId: IDS.company,
    role: 'resident' as const,
    email: DEMO_LOGINS.resident3.email,
    password: DEMO_LOGINS.resident3.password,
    name: DEMO_LOGINS.resident3.name,
    phone: '+971 50 666 7788',
    createdAt: created,
  }

  const buildingA = {
    id: IDS.buildingA,
    companyId: IDS.company,
    name: 'Tower A',
    address: 'Murikh, Abu Dhabi',
    unitPrefix: 'A',
    apartmentCount: 4,
    createdAt: created,
  }

  const buildingB = {
    id: IDS.buildingB,
    companyId: IDS.company,
    name: 'Garden Residences',
    address: 'Khalifa City, Abu Dhabi',
    unitPrefix: 'B',
    apartmentCount: 3,
    createdAt: created,
  }

  const apartments = [
    {
      id: IDS.aptA1,
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      label: 'A1',
      leaseName: 'Ahmed Ali',
      leaseStart: '2025-01-01',
      leaseEnd: '2025-12-31',
      leaseAmount: 120000,
      residentEmail: DEMO_LOGINS.resident.email,
      residentUserId: IDS.resident1,
    },
    {
      id: IDS.aptA2,
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      label: 'A2',
      leaseName: 'Mariam Hassan',
      leaseStart: '2025-06-01',
      leaseEnd: '2026-05-31',
      leaseAmount: 96000,
      residentEmail: DEMO_LOGINS.resident2.email,
      residentUserId: IDS.resident2,
    },
    {
      id: IDS.aptA3,
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      label: 'A3',
      leaseName: '',
      leaseStart: '',
      leaseEnd: '',
      leaseAmount: 0,
      residentEmail: '',
    },
    {
      id: IDS.aptA4,
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      label: 'A4',
      leaseName: '',
      leaseStart: '',
      leaseEnd: '',
      leaseAmount: 0,
      residentEmail: '',
    },
    {
      id: IDS.aptB1,
      companyId: IDS.company,
      buildingId: IDS.buildingB,
      label: 'B1',
      leaseName: 'Khalid Omar',
      leaseStart: '2025-03-01',
      leaseEnd: '2026-02-28',
      leaseAmount: 84000,
      residentEmail: DEMO_LOGINS.resident3.email,
      residentUserId: IDS.resident3,
    },
    {
      id: IDS.aptB2,
      companyId: IDS.company,
      buildingId: IDS.buildingB,
      label: 'B2',
      leaseName: '',
      leaseStart: '',
      leaseEnd: '',
      leaseAmount: 0,
      residentEmail: '',
    },
    {
      id: IDS.aptB3,
      companyId: IDS.company,
      buildingId: IDS.buildingB,
      label: 'B3',
      leaseName: '',
      leaseStart: '',
      leaseEnd: '',
      leaseAmount: 0,
      residentEmail: '',
    },
  ]

  const buildingBankAccounts = [
    {
      buildingId: IDS.buildingA,
      accountName: 'Al Noor Tower A Collections',
      bankName: 'First Abu Dhabi Bank',
      iban: 'AE070331234567890123456',
      accountNumber: '1234567890',
      swift: 'NBADAEAA',
      bankAddress: 'Corniche Road, Abu Dhabi',
    },
    {
      buildingId: IDS.buildingB,
      accountName: 'Al Noor Garden Collections',
      bankName: 'ADCB',
      iban: 'AE450030123456789012345',
      accountNumber: '9876543210',
      swift: 'ADCBAEAA',
      bankAddress: 'Khalifa Street, Abu Dhabi',
    },
  ]

  const invA1 = {
    id: 'demo_inv_a1',
    reference: invoiceReference(buildingA.name, period, 'A1'),
    companyId: IDS.company,
    buildingId: IDS.buildingA,
    apartmentId: IDS.aptA1,
    period,
    amount: 10000,
    status: 'paid' as const,
    paymentMethod: 'card' as const,
    paidAt: '2026-07-05T10:30:00.000Z',
    createdAt: created,
    updatedAt: now,
  }

  const invA2 = {
    id: 'demo_inv_a2',
    reference: invoiceReference(buildingA.name, period, 'A2'),
    companyId: IDS.company,
    buildingId: IDS.buildingA,
    apartmentId: IDS.aptA2,
    period,
    amount: 8000,
    status: 'pending_review' as const,
    paymentMethod: 'bank_transfer' as const,
    proofImage: '',
    createdAt: created,
    updatedAt: now,
  }

  const invB1 = {
    id: 'demo_inv_b1',
    reference: invoiceReference(buildingB.name, period, 'B1'),
    companyId: IDS.company,
    buildingId: IDS.buildingB,
    apartmentId: IDS.aptB1,
    period,
    amount: 7000,
    status: 'due' as const,
    createdAt: created,
    updatedAt: now,
  }

  const rentRecords = [
    {
      id: 'demo_rent_a1',
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      apartmentId: IDS.aptA1,
      period,
      status: 'paid' as const,
      updatedAt: now,
    },
    {
      id: 'demo_rent_a2',
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      apartmentId: IDS.aptA2,
      period,
      status: 'unpaid' as const,
      updatedAt: now,
    },
    {
      id: 'demo_rent_b1',
      companyId: IDS.company,
      buildingId: IDS.buildingB,
      apartmentId: IDS.aptB1,
      period,
      status: 'unpaid' as const,
      updatedAt: now,
    },
  ]

  const contractors = [
    {
      id: IDS.ctrPlumbA,
      buildingId: IDS.buildingA,
      category: 'plumbing' as const,
      name: 'Quick Flow Plumbing',
      phone: '+971501112233',
    },
    {
      id: IDS.ctrElecA,
      buildingId: IDS.buildingA,
      category: 'electrical' as const,
      name: 'Bright Spark Electrical',
      phone: '+971502223344',
    },
    {
      id: IDS.ctrHvacB,
      buildingId: IDS.buildingB,
      category: 'hvac' as const,
      name: 'Cool Air HVAC',
      phone: '+971503334455',
    },
    {
      id: IDS.ctrGenB,
      buildingId: IDS.buildingB,
      category: 'general' as const,
      name: 'Gulf Maintenance Services',
      phone: '+971504445566',
    },
  ]

  const tickets = [
    {
      id: IDS.ticket1,
      reference: 'TKT-TOWERAA-A1-001',
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      apartmentId: IDS.aptA1,
      residentUserId: IDS.resident1,
      category: 'plumbing' as const,
      title: 'Kitchen sink leak',
      description: 'Water is dripping under the kitchen sink cabinet.',
      status: 'open' as const,
      contractorId: IDS.ctrPlumbA,
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: now,
    },
    {
      id: IDS.ticket2,
      reference: 'TKT-GARDENB-B1-001',
      companyId: IDS.company,
      buildingId: IDS.buildingB,
      apartmentId: IDS.aptB1,
      residentUserId: IDS.resident3,
      category: 'electrical' as const,
      title: 'Bedroom power outlet not working',
      description: 'Main bedroom outlet stopped working yesterday evening.',
      status: 'in_progress' as const,
      contractorId: IDS.ctrGenB,
      whatsappNotifiedAt: '2026-07-21T11:00:00.000Z',
      whatsappNotifiedBy: IDS.admin,
      createdAt: '2026-07-19T14:30:00.000Z',
      updatedAt: now,
    },
    {
      id: IDS.ticket3,
      reference: 'TKT-TOWERAA-A2-001',
      companyId: IDS.company,
      buildingId: IDS.buildingA,
      apartmentId: IDS.aptA2,
      residentUserId: IDS.resident2,
      category: 'hvac' as const,
      title: 'AC not cooling',
      description: 'Living room AC runs but does not cool the room.',
      status: 'resolved' as const,
      contractorId: IDS.ctrElecA,
      resolvedAt: '2026-07-18T16:00:00.000Z',
      createdAt: '2026-07-15T08:00:00.000Z',
      updatedAt: '2026-07-18T16:00:00.000Z',
    },
  ]

  const thread1 = {
    id: IDS.thread1,
    companyId: IDS.company,
    residentUserId: IDS.resident1,
    apartmentId: IDS.aptA1,
    status: 'staff' as const,
    assignedStaffId: IDS.staff1,
    createdAt: '2026-07-10T12:00:00.000Z',
    updatedAt: now,
  }

  const thread2 = {
    id: IDS.thread2,
    companyId: IDS.company,
    residentUserId: IDS.resident2,
    apartmentId: IDS.aptA2,
    status: 'ai' as const,
    createdAt: '2026-07-22T09:30:00.000Z',
    updatedAt: now,
  }

  const chatMessages = [
    {
      id: 'demo_msg_1',
      threadId: IDS.thread1,
      senderRole: 'resident' as const,
      senderUserId: IDS.resident1,
      body: 'Hello, I submitted my rent payment by card. Can you confirm?',
      createdAt: '2026-07-10T12:01:00.000Z',
    },
    {
      id: 'demo_msg_2',
      threadId: IDS.thread1,
      senderRole: 'ai' as const,
      body: 'Check rent status on your home page and pay from the Pay rent tab.',
      createdAt: '2026-07-10T12:01:05.000Z',
    },
    {
      id: 'demo_msg_3',
      threadId: IDS.thread1,
      senderRole: 'resident' as const,
      senderUserId: IDS.resident1,
      body: 'I need to speak with staff please.',
      createdAt: '2026-07-10T12:02:00.000Z',
    },
    {
      id: 'demo_msg_4',
      threadId: IDS.thread1,
      senderRole: 'system' as const,
      body: 'This chat was transferred to support staff.',
      createdAt: '2026-07-10T12:02:01.000Z',
    },
    {
      id: 'demo_msg_5',
      threadId: IDS.thread1,
      senderRole: 'staff' as const,
      senderUserId: IDS.staff1,
      body: 'Hi Ahmed, your July rent shows as paid. Let me know if you need anything else.',
      createdAt: '2026-07-10T12:05:00.000Z',
    },
    {
      id: 'demo_msg_6',
      threadId: IDS.thread2,
      senderRole: 'resident' as const,
      senderUserId: IDS.resident2,
      body: 'How do I upload my bank transfer proof?',
      createdAt: '2026-07-22T09:31:00.000Z',
    },
    {
      id: 'demo_msg_7',
      threadId: IDS.thread2,
      senderRole: 'ai' as const,
      body: 'Check rent status on your home page and pay from the Pay rent tab.',
      createdAt: '2026-07-22T09:31:04.000Z',
    },
  ]

  const pendingRegistrations = [
    {
      id: IDS.pendingReg,
      companyName: 'Gulf Heights LLC',
      adminName: 'Yousef Al Nahyan',
      adminEmail: 'yousef@gulfheights.ae',
      phone: '+971 50 777 8899',
      status: 'pending' as const,
      createdAt: '2026-07-23T10:00:00.000Z',
    },
  ]

  const simulatedEmails = [
    {
      id: 'demo_mail_1',
      to: 'technician@mlihrent.app',
      subject: 'New company registration: Gulf Heights LLC',
      body: 'A new company requested access.\n\nCompany: Gulf Heights LLC\nAdmin: Yousef Al Nahyan\nEmail: yousef@gulfheights.ae',
      kind: 'technician_alert' as const,
      createdAt: '2026-07-23T10:00:01.000Z',
    },
    {
      id: 'demo_mail_2',
      to: DEMO_LOGINS.admin.email,
      subject: 'MlihRent — welcome to Al Noor Property Management',
      body: `Welcome to MlihRent!\n\nYour demo admin account is ready.\n\nLogin: ${DEMO_LOGINS.admin.email}\nPassword: ${DEMO_LOGINS.admin.password}`,
      kind: 'approval' as const,
      createdAt: created,
    },
    {
      id: 'demo_mail_3',
      to: DEMO_LOGINS.staff.email,
      subject: 'MlihRent — staff account created',
      body: `Your staff account for Al Noor Property Management is ready.\n\nLogin: ${DEMO_LOGINS.staff.email}\nPassword: ${DEMO_LOGINS.staff.password}`,
      kind: 'staff_welcome' as const,
      createdAt: created,
    },
    {
      id: 'demo_mail_4',
      to: DEMO_LOGINS.admin.email,
      subject: 'Maintenance ticket opened — Kitchen sink leak',
      body: 'A resident opened a maintenance ticket in Tower A / A1.\n\nCategory: plumbing\nTitle: Kitchen sink leak',
      kind: 'ticket_alert' as const,
      createdAt: '2026-07-20T09:00:01.000Z',
    },
  ]

  return {
    ...base,
    pendingRegistrations: [...pendingRegistrations, ...base.pendingRegistrations],
    companies: [company, ...base.companies],
    users: [admin, staff1, staff2, resident1, resident2, resident3, ...base.users],
    buildings: [buildingA, buildingB, ...base.buildings],
    apartments,
    rentRecords,
    invoices: [invA1, invA2, invB1],
    buildingBankAccounts,
    chatThreads: [thread1, thread2, ...base.chatThreads],
    chatMessages: [...chatMessages, ...base.chatMessages],
    maintenanceTickets: tickets,
    buildingContractors: contractors,
    simulatedEmails: [...simulatedEmails, ...base.simulatedEmails],
    initialized: true,
  }
}

export function demoLoginSummary(): string {
  return [
    'Demo company: Al Noor Property Management',
    '',
    'Admin:    admin@demo.mlihrent / DemoAdmin2026!',
    'Staff:    staff@demo.mlihrent / DemoStaff2026!',
    'Staff 2:  support@demo.mlihrent / DemoStaff2026!',
    'Resident: resident@demo.mlihrent / DemoResident2026! (Tower A / A1)',
    'Resident: mariam@demo.mlihrent / DemoResident2026! (Tower A / A2)',
    'Resident: khalid@demo.mlihrent / DemoResident2026! (Garden / B1)',
    '',
    'Technician: technician@mlihrent.app / TechDemo2026!',
  ].join('\n')
}
