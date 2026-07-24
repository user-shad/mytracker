import { useEffect, useState, type ChangeEvent } from 'react'
import { Badge, Button, Card, Field, Flash } from './ui'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatMoney } from '../lib/formatMoney'
import { isBankConfigured, paymentMethodLabel } from '../lib/invoices'
import { t } from '../i18n/translations'
import type { InvoiceStatus } from '../types'

function invoiceStatusLabel(lang: 'en' | 'ar', status: InvoiceStatus) {
  if (status === 'paid') return t(lang, 'invoicePaid')
  if (status === 'pending_review') return t(lang, 'invoicePendingReview')
  return t(lang, 'invoiceDue')
}

function invoiceStatusTone(status: InvoiceStatus): 'good' | 'bad' | 'warn' {
  if (status === 'paid') return 'good'
  if (status === 'pending_review') return 'warn'
  return 'bad'
}

export function ResidentPayPanel({
  apartmentId,
  buildingId,
  onNotice,
}: {
  apartmentId: string
  buildingId: string
  onNotice: (message: string, tone: 'good' | 'bad') => void
}) {
  const { lang } = useLang()
  const {
    ensureApartmentInvoiceNow,
    getInvoiceForApartment,
    getBuildingBankAccount,
    submitBankTransfer,
    payInvoiceOnline,
  } = useData()
  const period = currentRentPeriod()
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  useEffect(() => {
    ensureApartmentInvoiceNow(apartmentId, period)
  }, [apartmentId, period, ensureApartmentInvoiceNow])

  const invoice = getInvoiceForApartment(apartmentId, period)
  const bank = getBuildingBankAccount(buildingId)

  const handleProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setProofPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProofPreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitProof = () => {
    if (!invoice) return
    const result = submitBankTransfer(invoice.id, proofPreview ?? '')
    if (!result.ok) {
      if (result.error === 'bank_not_configured') {
        onNotice(t(lang, 'bankNotConfigured'), 'bad')
      } else if (result.error === 'already_paid') {
        onNotice(t(lang, 'invoiceAlreadyPaid'), 'bad')
      } else {
        onNotice(t(lang, 'proofRequired'), 'bad')
      }
      return
    }
    onNotice(t(lang, 'proofSubmitted'), 'good')
    setProofPreview(null)
  }

  const handlePayOnline = async (method: 'apple_pay' | 'card') => {
    if (!invoice) return
    const result = await payInvoiceOnline(invoice.id, method)
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    if (!result.ok) {
      onNotice(t(lang, 'invoiceAlreadyPaid'), 'bad')
      return
    }
    onNotice(t(lang, 'paymentSuccess'), 'good')
  }

  if (!invoice) {
    return (
      <Card>
        <p className="muted">{t(lang, 'noInvoice')}</p>
      </Card>
    )
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <h3>{t(lang, 'payRent')}</h3>
        <p className="muted">{formatRentPeriod(period, lang)}</p>
        <dl className="info-list">
          <div>
            <dt>{t(lang, 'invoiceReference')}</dt>
            <dd>
              <code>{invoice.reference}</code>
            </dd>
          </div>
          <div>
            <dt>{t(lang, 'invoiceAmount')}</dt>
            <dd>{formatMoney(invoice.amount, lang)}</dd>
          </div>
          <div>
            <dt>{t(lang, 'invoiceStatus')}</dt>
            <dd>
              <Badge tone={invoiceStatusTone(invoice.status)}>
                {invoiceStatusLabel(lang, invoice.status)}
              </Badge>
            </dd>
          </div>
          {invoice.paymentMethod && invoice.status === 'paid' ? (
            <div>
              <dt>{t(lang, 'paymentMethod')}</dt>
              <dd>{paymentMethodLabel(invoice.paymentMethod, lang)}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {invoice.status === 'paid' ? (
        <Card className="payment-status-card">
          <Flash tone="good">{t(lang, 'paymentSuccess')}</Flash>
        </Card>
      ) : null}

      {invoice.status === 'pending_review' ? (
        <Card>
          <Flash tone="info">{t(lang, 'pendingReviewNote')}</Flash>
          {invoice.proofImage ? (
            <div className="proof-preview">
              <img src={invoice.proofImage} alt={t(lang, 'viewProof')} />
            </div>
          ) : null}
        </Card>
      ) : null}

      {invoice.status === 'due' ? (
        <>
          <Card>
            <h3>{t(lang, 'bankTransfer')}</h3>
            {isBankConfigured(bank) ? (
              <>
                <p className="muted">{t(lang, 'bankTransferNote')}</p>
                <dl className="info-list">
                  <div>
                    <dt>{t(lang, 'accountName')}</dt>
                    <dd>{bank.accountName}</dd>
                  </div>
                  <div>
                    <dt>{t(lang, 'bankName')}</dt>
                    <dd>{bank.bankName || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t(lang, 'iban')}</dt>
                    <dd>
                      <code>{bank.iban}</code>
                    </dd>
                  </div>
                  {bank.accountNumber ? (
                    <div>
                      <dt>{t(lang, 'accountNumber')}</dt>
                      <dd>{bank.accountNumber}</dd>
                    </div>
                  ) : null}
                  {bank.swift ? (
                    <div>
                      <dt>{t(lang, 'swift')}</dt>
                      <dd>{bank.swift}</dd>
                    </div>
                  ) : null}
                  {bank.bankAddress ? (
                    <div>
                      <dt>{t(lang, 'bankAddress')}</dt>
                      <dd>{bank.bankAddress}</dd>
                    </div>
                  ) : null}
                </dl>
                <Field label={t(lang, 'uploadProof')} hint={t(lang, 'proofHint')}>
                  <input type="file" accept="image/*" onChange={handleProofChange} />
                </Field>
                {proofPreview ? (
                  <div className="proof-preview">
                    <img src={proofPreview} alt={t(lang, 'viewProof')} />
                  </div>
                ) : null}
                <Button type="button" onClick={handleSubmitProof}>
                  {t(lang, 'submitProof')}
                </Button>
              </>
            ) : (
              <Flash tone="info">{t(lang, 'bankNotConfigured')}</Flash>
            )}
          </Card>

          <Card>
            <h3>{t(lang, 'payOnline')}</h3>
            <p className="muted">{t(lang, 'payOnlineNote')}</p>
            <div className="payment-actions">
              <Button type="button" onClick={() => handlePayOnline('apple_pay')}>
                Apple Pay
              </Button>
              <Button type="button" variant="soft" onClick={() => handlePayOnline('card')}>
                {t(lang, 'payWithCard')}
              </Button>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
