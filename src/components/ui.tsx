import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M10 14h4M18 14h4M10 19h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 8V4M12 4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card ${className}`.trim()}>{children}</div>
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft' }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...props} />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  )
}

export function PageShell({
  title,
  subtitle,
  onBack,
  backLabel,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          {onBack ? (
            <button type="button" className="back-link" onClick={onBack}>
              ← {backLabel}
            </button>
          ) : null}
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'bad'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>
}

export function Flash({ tone, children }: { tone: 'good' | 'bad' | 'info'; children: ReactNode }) {
  return <div className={`flash flash-${tone}`}>{children}</div>
}
