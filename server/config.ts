import { isDatabaseEnabled } from './db.ts'

export function getConfig() {
  return {
    version: '4.1.0',
    databaseEnabled: isDatabaseEnabled(),
    storeBackend: isDatabaseEnabled() ? 'postgres' : 'json',
    emailEnabled: Boolean(process.env.RESEND_API_KEY),
    gptEnabled: Boolean(process.env.OPENAI_API_KEY),
    stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookEnabled: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  }
}

export function getPort(): number {
  return Number(process.env.PORT ?? 3001)
}

export function getAppOrigin(): string {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, '')
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`.replace(/\/$/, '')
  }
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  return 'http://localhost:5173'
}
