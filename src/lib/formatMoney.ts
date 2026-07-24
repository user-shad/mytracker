export function formatMoney(amount: number, lang: 'en' | 'ar', currency = 'AED'): string {
  if (!amount || amount <= 0) return '—'
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-AE' : 'en-AE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
