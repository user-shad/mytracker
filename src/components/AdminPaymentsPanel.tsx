import { useEffect, useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  StatCard,
} from './ui'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useLang } from '../context/LangContext'
import { currentRentPeriod, formatRentPeriod } from '../lib/rentPeriod'
import { formatMoney } from '../lib/formatMoney'
import { paymentMethodLabel } from '../lib/invoices'
import { t } from '../i18n/translations'
import type { Building, InvoiceStatus } from '../types'

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

export function AdminPaymentsPanel({
  buildings,
  onNotice,
}: {
  buildings: Building[]
  onNotice: (message: string, tone?: 'good' | 'bad' | 'info') => void
}) {
  const { lang } = useLang()
  const { user } = useAuth()
  const {
    data,
    ensureBuildingInvoices,
    getInvoicesForBuilding,
    getBuildingPaymentSummary,
    getBuildingBankAccount,
    updateBuildingBankAccount,
    approveBankTransfer,
    rejectBankTransfer,
    setRentStatus,
  } = useData()

  const period = currentRentPeriod()
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0]?.id ?? '')
  const [accountName, setAccountName] = useState('')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [swift, setSwift] = useState('')
  const [bankAddress, setBankAddress] = useState('')

  useEffect(() => {
    if (selectedBuildingId) ensureBuildingInvoices(selectedBuildingId, period)
  }, [selectedBuildingId, period, ensureBuildingInvoices])

  useEffect(() => {
    if (!selectedBuildingId) return
    const account = getBuildingBankAccount(selectedBuildingId)
    setAccountName(account.accountName)
    setBankName(account.bankName)
    setIban(account.iban)
    setAccountNumber(account.accountNumber)
    setSwift(account.swift)
    setBankAddress(account.bankAddress)
  }, [selectedBuildingId, getBuildingBankAccount, data.buildingBankAccounts])

  const invoices = selectedBuildingId ? getInvoicesForBuilding(selectedBuildingId, period) : []
  const summary = selectedBuildingId ? getBuildingPaymentSummary(selectedBuildingId, period) : null

  const aptLabel = (apartmentId: string) =>
    data.apartments.find((a) => a.id === apartmentId)?.label ?? '—'

  const handleBankSave = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedBuildingId) return
    updateBuildingBankAccount(selectedBuildingId, {
      accountName,
      bankName,
      iban,
      accountNumber,
      swift,
      bankAddress,
    })
    onNotice(t(lang, 'bankSaved'), 'good')
  }

  const handleApprove = (invoiceId: string) => {
    if (!user) return
    approveBankTransfer(invoiceId, user.id)
    onNotice(t(lang, 'transferApproved'), 'good')
  }

  const handleReject = (invoiceId: string) => {
    rejectBankTransfer(invoiceId)
    onNotice(t(lang, 'transferRejected'), 'info')
  }

  const togglePaid = (apartmentId: string, currentlyPaid: boolean) => {
    setRentStatus(apartmentId, period, currentlyPaid ? 'unpaid' : 'paid')
    onNotice(t(lang, 'rentStatusUpdated'), 'good')
  }

  if (!buildings.length) {
    return (
      <Card>
        <EmptyState>{t(lang, 'noInvoices')}</EmptyState>
      </Card>
    )
  }

  return (
    <div className="stack-gap payment-panel">
      <Card>
        <Field label={t(lang, 'selectBuilding')}>
          <select
            className="input"
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="muted">
          {t(lang, 'paymentTotals')} — {formatRentPeriod(period, lang)}
        </p>
      </Card>

      {summary ? (
        <div className="stat-row">
          <StatCard label={t(lang, 'totalDue')} value={formatMoney(summary.totalDue, lang)} />
          <StatCard label={t(lang, 'totalPending')} value={formatMoney(summary.totalPending, lang)} />
          <StatCard label={t(lang, 'totalPaid')} value={formatMoney(summary.totalPaid, lang)} />
        </div>
      ) : null}

      <div className="two-col">
        <Card>
          <h3>{t(lang, 'bankSettings')}</h3>
          <p className="muted">{t(lang, 'bankSettingsHint')}</p>
          <form className="stack-form" onSubmit={handleBankSave}>
            <Field label={t(lang, 'accountName')}>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </Field>
            <Field label={t(lang, 'bankName')}>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </Field>
            <Field label={t(lang, 'iban')}>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} required />
            </Field>
            <Field label={t(lang, 'accountNumber')}>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </Field>
            <Field label={t(lang, 'swift')}>
              <Input value={swift} onChange={(e) => setSwift(e.target.value)} />
            </Field>
            <Field label={t(lang, 'bankAddress')}>
              <Input value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} />
            </Field>
            <Button type="submit">{t(lang, 'save')}</Button>
          </form>
        </Card>

        <Card>
          <h3>{t(lang, 'payments')}</h3>
          {invoices.length ? (
            <div className="rent-table-wrap">
              <table className="rent-table">
                <thead>
                  <tr>
                    <th>{t(lang, 'unit')}</th>
                    <th>{t(lang, 'invoiceReference')}</th>
                    <th>{t(lang, 'invoiceAmount')}</th>
                    <th>{t(lang, 'status')}</th>
                    <th>{t(lang, 'actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{aptLabel(invoice.apartmentId)}</td>
                      <td>
                        <code>{invoice.reference}</code>
                      </td>
                      <td>{formatMoney(invoice.amount, lang)}</td>
                      <td>
                        <Badge tone={invoiceStatusTone(invoice.status)}>
                          {invoiceStatusLabel(lang, invoice.status)}
                        </Badge>
                        {invoice.paymentMethod ? (
                          <div className="muted payment-method-note">
                            {paymentMethodLabel(invoice.paymentMethod, lang)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="inline-actions payment-row-actions">
                          {invoice.status === 'pending_review' ? (
                            <>
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
                            </>
                          ) : null}
                          {invoice.status !== 'pending_review' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                togglePaid(invoice.apartmentId, invoice.status === 'paid')
                              }
                            >
                              {invoice.status === 'paid' ? t(lang, 'markUnpaid') : t(lang, 'markPaidManual')}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>{t(lang, 'noInvoices')}</EmptyState>
          )}
        </Card>
      </div>
    </div>
  )
}
