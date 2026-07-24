import { useMemo } from 'react'
import { Badge, Button, Card, EmptyState } from './ui'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatMoney } from '../lib/formatMoney'
import { t } from '../i18n/translations'

export function StaffTransfersPanel({
  companyId,
  onNotice,
}: {
  companyId: string
  onNotice: (message: string, tone?: 'good' | 'bad' | 'info') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const { data, approveBankTransfer, rejectBankTransfer } = useData()
  const period = currentRentPeriod()

  const pending = useMemo(() => {
    const buildingMap = new Map(
      data.buildings.filter((b) => b.companyId === companyId).map((b) => [b.id, b.name]),
    )
    const apartmentMap = new Map(
      data.apartments.filter((a) => a.companyId === companyId).map((a) => [a.id, a]),
    )

    return data.invoices
      .filter(
        (invoice) =>
          invoice.companyId === companyId &&
          invoice.period === period &&
          invoice.status === 'pending_review',
      )
      .map((invoice) => {
        const apt = apartmentMap.get(invoice.apartmentId)
        return {
          ...invoice,
          buildingName: buildingMap.get(invoice.buildingId) ?? '—',
          unitLabel: apt?.label ?? '—',
          leaseName: apt?.leaseName ?? '—',
        }
      })
      .sort((a, b) => a.reference.localeCompare(b.reference))
  }, [data.invoices, data.buildings, data.apartments, companyId, period])

  const handleApprove = (invoiceId: string) => {
    if (!user) return
    approveBankTransfer(invoiceId, user.id)
    onNotice(t(lang, 'transferApproved'), 'good')
  }

  const handleReject = (invoiceId: string) => {
    rejectBankTransfer(invoiceId)
    onNotice(t(lang, 'transferRejected'), 'info')
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <h3>{t(lang, 'staffTransfers')}</h3>
        <p className="muted">{t(lang, 'staffTransfersHint')}</p>
        <p className="muted">
          {formatRentPeriod(period, lang)} · {pending.length}{' '}
          {pending.length === 1 ? t(lang, 'pendingTransferSingular') : t(lang, 'pendingTransferPlural')}
        </p>
      </Card>

      {pending.length ? (
        <div className="stack-gap">
          {pending.map((invoice) => (
            <Card key={invoice.id} className="transfer-review-card">
              <div className="transfer-review-head">
                <div>
                  <strong>
                    {invoice.buildingName} · {invoice.unitLabel}
                  </strong>
                  <p className="muted">
                    {invoice.leaseName} · <code>{invoice.reference}</code>
                  </p>
                </div>
                <Badge tone="warn">{t(lang, 'invoicePendingReview')}</Badge>
              </div>
              <dl className="info-list">
                <div>
                  <dt>{t(lang, 'invoiceAmount')}</dt>
                  <dd>{formatMoney(invoice.amount, lang)}</dd>
                </div>
              </dl>
              {invoice.proofImage ? (
                <div className="proof-preview">
                  <img src={invoice.proofImage} alt={t(lang, 'viewProof')} />
                </div>
              ) : null}
              <div className="inline-actions">
                {invoice.proofImage ? (
                  <a
                    className="proof-link"
                    href={invoice.proofImage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t(lang, 'viewProof')}
                  </a>
                ) : null}
                <Button type="button" variant="soft" onClick={() => handleApprove(invoice.id)}>
                  {t(lang, 'approveTransfer')}
                </Button>
                <Button type="button" variant="danger" onClick={() => handleReject(invoice.id)}>
                  {t(lang, 'rejectTransfer')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState>{t(lang, 'noPendingTransfers')}</EmptyState>
        </Card>
      )}
    </div>
  )
}
