export function formatDisplayDate(iso: string, lang: 'en' | 'ar'): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
