import type { Lang } from '../../src/context/LangContext.ts'
import { assistantReply } from '../../src/lib/assistantReply.ts'

const SYSTEM_PROMPT =
  'You are MlihRent, a scoped assistant for a building management app. Help residents with rent status, payments, apartment info, maintenance tickets, and support handoff. Stay on topic. If the user asks for a human, set escalate intent. Reply in the user language.'

export async function getAssistantReply(
  message: string,
  lang: Lang,
): Promise<{ body: string; escalate: boolean }> {
  const trimmed = message.trim()
  if (!trimmed) return assistantReply(message, lang)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return assistantReply(trimmed, lang)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              lang === 'ar'
                ? `رد بالعربية فقط.\n\nسؤال الساكن: ${trimmed}`
                : `Reply in English only.\n\nResident question: ${trimmed}`,
          },
        ],
      }),
    })

    if (!response.ok) return assistantReply(trimmed, lang)

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const body = payload.choices?.[0]?.message?.content?.trim()
    if (!body) return assistantReply(trimmed, lang)

    const escalate = /escalate|human|staff|support|موظف|دعم|تحويل/i.test(body)
    return { body, escalate }
  } catch {
    return assistantReply(trimmed, lang)
  }
}
