import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ChatMessage, UserRole } from '../types'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { Button, Input } from './ui'

export function ChatPanel({
  messages,
  viewerRole,
  onSend,
  onRequestStaff,
  disabled,
}: {
  messages: ChatMessage[]
  viewerRole: UserRole
  onSend: (body: string) => void
  onRequestStaff?: () => void
  disabled?: boolean
}) {
  const { lang } = useLang()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || disabled) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg) => {
          const mine =
            (viewerRole === 'resident' && msg.senderRole === 'resident') ||
            (viewerRole === 'staff' && msg.senderRole === 'staff')
          const tone =
            msg.senderRole === 'system'
              ? 'system'
              : msg.senderRole === 'ai'
                ? 'ai'
                : mine
                  ? 'mine'
                  : 'theirs'

          return (
            <div key={msg.id} className={`chat-bubble chat-${tone}`}>
              <span className="chat-role">
                {msg.senderRole === 'ai'
                  ? t(lang, 'assistantLabel')
                  : msg.senderRole === 'system'
                    ? t(lang, 'systemLabel')
                    : msg.senderRole === 'staff'
                      ? t(lang, 'staffLabel')
                      : t(lang, 'youLabel')}
              </span>
              <p>{msg.body}</p>
              <time>{new Date(msg.createdAt).toLocaleTimeString()}</time>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {!disabled ? (
        <form className="chat-compose" onSubmit={handleSubmit}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t(lang, 'chatPlaceholder')}
          />
          <div className="inline-actions">
            <Button type="submit">{t(lang, 'send')}</Button>
            {onRequestStaff ? (
              <Button type="button" variant="soft" onClick={onRequestStaff}>
                {t(lang, 'talkToStaff')}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  )
}
