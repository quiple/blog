const seoulDateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Match the article publication-date format regardless of the host time zone. */
export function importPubDate(date: Date): string {
  const parts = Object.fromEntries(seoulDateTime.formatToParts(date).map(({type, value}) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}
