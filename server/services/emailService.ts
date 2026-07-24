import type { SimulatedEmail } from '../../src/types/index.ts'
import { nowIso, uid } from '../../src/lib/utils.ts'

export async function dispatchEmail(
  email: Omit<SimulatedEmail, 'id' | 'createdAt'>,
): Promise<{ sent: boolean; simulated: boolean; email: SimulatedEmail }> {
  const entry: SimulatedEmail = {
    ...email,
    id: uid('mail_'),
    createdAt: nowIso(),
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'MyTracker <onboarding@resend.dev>'

  if (!apiKey) {
    return { sent: false, simulated: true, email: entry }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        text: email.body,
      }),
    })

    if (!response.ok) {
      return { sent: false, simulated: true, email: entry }
    }

    return { sent: true, simulated: false, email: entry }
  } catch {
    return { sent: false, simulated: true, email: entry }
  }
}
