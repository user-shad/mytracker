import { CLOUD } from '../config/platform'
import type { Lang } from '../context/LangContext'
import type { AppData, SimulatedEmail } from '../types'

export interface ServerConfig {
  version: string
  emailEnabled: boolean
  gptEnabled: boolean
  stripeEnabled: boolean
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CLOUD.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`API ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch<{ ok: boolean }>('/health')
    return true
  } catch {
    return false
  }
}

export async function fetchServerConfig(): Promise<ServerConfig> {
  return apiFetch<ServerConfig>('/config')
}

export async function fetchCloudData(): Promise<AppData> {
  return apiFetch<AppData>('/data')
}

export async function saveCloudData(data: AppData): Promise<void> {
  await apiFetch('/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchAssistantReply(
  message: string,
  lang: Lang,
): Promise<{ body: string; escalate: boolean }> {
  return apiFetch('/assistant/reply', {
    method: 'POST',
    body: JSON.stringify({ message, lang }),
  })
}

export async function sendEmailApi(
  email: Omit<SimulatedEmail, 'id' | 'createdAt'>,
): Promise<{ sent: boolean; simulated: boolean }> {
  return apiFetch('/email/send', {
    method: 'POST',
    body: JSON.stringify(email),
  })
}

export async function createCheckout(
  invoiceId: string,
  method: 'apple_pay' | 'card',
): Promise<{ ok: boolean; simulated?: boolean; url?: string; error?: string }> {
  return apiFetch('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, method }),
  })
}

export async function confirmCheckout(sessionId: string): Promise<{ ok: boolean; invoiceId?: string }> {
  return apiFetch('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}
