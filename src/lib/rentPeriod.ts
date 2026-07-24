export function currentRentPeriod(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function formatRentPeriod(period: string, lang: 'en' | 'ar'): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}
