export interface CalEvent {
  uid: string
  title: string
  start: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD, inclusive last day (defaults to start)
  desc?: string
  kind: 'trip' | 'visa' | 'flight' | 'passport'
}

const compact = (d: string) => d.replace(/-/g, '')
const plusDay = (d: string, n = 1) => {
  const t = new Date(d + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** All-day events; DTEND is exclusive per RFC 5545. */
export function buildICS(events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SSM Travel & Tours Co., Ltd.//EN', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@travelops.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(plusDay(e.end ?? e.start))}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.desc ? [`DESCRIPTION:${esc(e.desc)}`] : []),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function googleCalendarUrl(e: CalEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${compact(e.start)}/${compact(plusDay(e.end ?? e.start))}`,
    details: e.desc ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function download(filename: string, text: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export { plusDay }
