import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Lang } from '../src/context/LangContext.ts'
import type { AppData } from '../src/types/index.ts'
import { getAppOrigin, getConfig, getPort } from './config.ts'
import { initStore, loadStore, saveStore, storeBackend } from './store.ts'
import { getAssistantReply } from './services/assistantService.ts'
import { dispatchEmail } from './services/emailService.ts'
import {
  confirmCheckoutSession,
  createCheckoutSession,
  handleStripeWebhook,
  markInvoicePaidSimulated,
} from './services/stripeService.ts'
const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')
const isWebsite = existsSync(distPath)

const app = express()
app.use(cors())

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'missing_signature' })
      return
    }

    const result = await handleStripeWebhook(req.body as Buffer, signature)
    if (!result.ok) {
      res.status(400).json(result)
      return
    }
    res.json({ received: true })
  },
)

app.use(express.json({ limit: '12mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: getConfig().version, store: storeBackend() })
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

async function start() {
  await initStore()

  const port = getPort()
  app.listen(port, '0.0.0.0', () => {
    const config = getConfig()
    const origin = getAppOrigin()
    if (isWebsite) {
      console.log(`MlihRent website live at ${origin}`)
    } else {
      console.log(`MlihRent API listening on http://localhost:${port}`)
    }
    console.log(
      `Store: ${config.storeBackend}, email=${config.emailEnabled ? 'live' : 'simulated'}, gpt=${config.gptEnabled ? 'live' : 'rules'}, stripe=${config.stripeEnabled ? 'live' : 'simulated'}`,
    )
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
