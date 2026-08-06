import Stripe from 'stripe'
import type { AppData } from '../../src/types/index.ts'
import { markInvoicePaid } from '../../src/lib/paymentStore.ts'
import { getAppOrigin } from '../config.ts'
import { loadStore, saveStore } from '../store.ts'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

export async function createCheckoutSession(
  invoiceId: string,
  method: 'apple_pay' | 'card',
): Promise<{ ok: boolean; simulated?: boolean; url?: string; error?: string }> {
  const data = loadStore()
  const invoice = data.invoices.find((item) => item.id === invoiceId)
  if (!invoice) return { ok: false, error: 'not_found' }
  if (invoice.status === 'paid') return { ok: false, error: 'already_paid' }

  const stripe = getStripe()
  if (!stripe) {
    return { ok: true, simulated: true }
  }

  const origin = getAppOrigin()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: method === 'apple_pay' ? ['card'] : ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(invoice.amount * 100),
          product_data: {
            name: `Rent ${invoice.reference}`,
          },
        },
      },
    ],
    metadata: {
      invoiceId,
      method,
    },
    success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?payment=cancelled`,
  })

  if (!session.url) return { ok: false, error: 'checkout_failed' }
  return { ok: true, url: session.url }
}

export async function confirmCheckoutSession(
  sessionId: string,
): Promise<{ ok: boolean; invoiceId?: string; error?: string }> {
  const stripe = getStripe()
  if (!stripe) return { ok: false, error: 'stripe_not_configured' }

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') {
    return { ok: false, error: 'not_paid' }
  }

  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId) return { ok: false, error: 'missing_invoice' }

  const data = loadStore()
  const invoice = data.invoices.find((item) => item.id === invoiceId)
  if (!invoice) return { ok: false, error: 'not_found' }
  if (invoice.status === 'paid') return { ok: true, invoiceId }

  const method = session.metadata?.method === 'apple_pay' ? 'apple_pay' : 'card'
  const next = markInvoicePaid(data, invoiceId, method)
  saveStore(next)
  return { ok: true, invoiceId }
}

export function markInvoicePaidSimulated(
  data: AppData,
  invoiceId: string,
  method: 'apple_pay' | 'card',
): AppData {
  return markInvoicePaid(data, invoiceId, method)
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<{ ok: boolean; error?: string }> {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return { ok: false, error: 'not_configured' }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    return { ok: false, error: 'invalid_signature' }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return { ok: true }

    const invoiceId = session.metadata?.invoiceId
    if (!invoiceId) return { ok: false, error: 'missing_invoice' }

    const data = loadStore()
    const invoice = data.invoices.find((item) => item.id === invoiceId)
    if (!invoice || invoice.status === 'paid') return { ok: true }

    const method = session.metadata?.method === 'apple_pay' ? 'apple_pay' : 'card'
    saveStore(markInvoicePaid(data, invoiceId, method))
  }

  return { ok: true }
}
