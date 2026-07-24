import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Lang } from '../src/context/LangContext.ts'
import type { AppData } from '../src/types/index.ts'
import { getAppOrigin, getConfig, getPort } from './config.ts'
import { loadStore, saveStore } from './store.ts'
import { getAssistantReply } from './services/assistantService.ts'
import { dispatchEmail } from './services/emailService.ts'
import {
  confirmCheckoutSession,
  createCheckoutSession,
  markInvoicePaidSimulated,
} from './services/stripeService.ts'
import { buildDemoData, demoLoginSummary, isDemoLoaded } from '../src/lib/demoData.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')
const isWebsite = existsSync(distPath)

const app = express()
app.use(cors())
app.use(express.json({ limit: '12mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: getConfig().version })
})

app.get('/api/config', (_req, res) => {
  res.json(getConfig())
})

app.get('/api/data', (_req, res) => {
  res.json(loadStore())
})

app.put('/api/data', (req, res) => {
  const body = req.body as AppData
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid_body' })
    return
  }
  res.json(saveStore(body))
})

app.post('/api/assistant/reply', async (req, res) => {
  const { message, lang } = req.body as { message?: string; lang?: Lang }
  if (!message || !lang) {
    res.status(400).json({ error: 'required' })
    return
  }
  const reply = await getAssistantReply(message, lang)
  res.json(reply)
})

app.post('/api/email/send', async (req, res) => {
  const { to, subject, body, kind } = req.body as {
    to?: string
    subject?: string
    body?: string
    kind?: AppData['simulatedEmails'][number]['kind']
  }

  if (!to || !subject || !body || !kind) {
    res.status(400).json({ error: 'required' })
    return
  }

  const result = await dispatchEmail({ to, subject, body, kind })
  res.json({ sent: result.sent, simulated: result.simulated, email: result.email })
})

app.post('/api/payments/checkout', async (req, res) => {
  const { invoiceId, method } = req.body as {
    invoiceId?: string
    method?: 'apple_pay' | 'card'
  }

  if (!invoiceId || !method) {
    res.status(400).json({ error: 'required' })
    return
  }

  const result = await createCheckoutSession(invoiceId, method)
  if (result.simulated) {
    const next = markInvoicePaidSimulated(loadStore(), invoiceId, method)
    saveStore(next)
  }
  res.json(result)
})

app.post('/api/payments/confirm', async (req, res) => {
  const { sessionId } = req.body as { sessionId?: string }
  if (!sessionId) {
    res.status(400).json({ error: 'required' })
    return
  }
  const result = await confirmCheckoutSession(sessionId)
  res.json(result)
})

app.post('/api/seed/demo', (_req, res) => {
  const data = saveStore(buildDemoData(loadStore()))
  res.json({
    ok: true,
    message: 'Demo data loaded',
    company: 'Al Noor Property Management',
    logins: demoLoginSummary(),
    stats: {
      companies: data.companies.length,
      buildings: data.buildings.length,
      users: data.users.length,
      apartments: data.apartments.length,
      invoices: data.invoices.length,
      tickets: data.maintenanceTickets.length,
      pendingRegistrations: data.pendingRegistrations.filter((reg) => reg.status === 'pending')
        .length,
    },
  })
})

if (isWebsite) {
  app.use(express.static(distPath, { index: false, maxAge: '1d' }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(join(distPath, 'index.html'))
  })
}

const port = getPort()
let bootData = loadStore()
if (!isDemoLoaded(bootData)) {
  bootData = saveStore(buildDemoData(bootData))
  console.log('Loaded demo data for Al Noor Property Management')
}

app.listen(port, '0.0.0.0', () => {
  const config = getConfig()
  const origin = getAppOrigin()
  if (isWebsite) {
    console.log(`MyTracker website live at ${origin}`)
  } else {
    console.log(`MyTracker API listening on http://localhost:${port}`)
  }
  console.log(
    `Services: email=${config.emailEnabled ? 'live' : 'simulated'}, gpt=${config.gptEnabled ? 'live' : 'rules'}, stripe=${config.stripeEnabled ? 'live' : 'simulated'}`,
  )
})
