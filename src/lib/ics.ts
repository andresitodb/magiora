// Helper for generating .ics calendar files.
// Spec: https://datatracker.ietf.org/doc/html/rfc5545

type EventForIcs = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  online_link: string | null;
};

// Format a date as iCalendar UTC: 20260612T193000Z
function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

// Escape special characters per RFC 5545
function escapeIcs(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Fold long lines at 75 octets per RFC 5545
function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (i === 0) {
      out += line.slice(i, 75);
      i = 75;
    } else {
      out += '\r\n ' + line.slice(i, i + 74);
      i += 74;
    }
  }
  return out;
}

export function buildIcsEvent(event: EventForIcs, siteUrl: string): string[] {
  const start = toIcsDate(event.event_date);
  const end = toIcsDate(
    event.end_date ??
      new Date(new Date(event.event_date).getTime() + 2 * 60 * 60 * 1000).toISOString()
  );

  const location = [event.location_name, event.location_address]
    .filter(Boolean)
    .join(', ');

  const lines = [
    'BEGIN:VEVENT',
    `UID:event-${event.id}@kinora.com`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    fold(`SUMMARY:${escapeIcs(event.title)}`),
  ];

  if (event.description) {
    lines.push(fold(`DESCRIPTION:${escapeIcs(event.description)}`));
  }
  if (location) {
    lines.push(fold(`LOCATION:${escapeIcs(location)}`));
  }
  if (event.online_link) {
    lines.push(fold(`URL:${event.online_link}`));
  } else {
    lines.push(fold(`URL:${siteUrl}/events/${event.id}`));
  }

  lines.push('END:VEVENT');
  return lines;
}

export function buildIcsFile(events: EventForIcs[], siteUrl: string, calendarName: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinora//Indie Cinema//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    `X-WR-CALDESC:${escapeIcs('Kinora events — indie cinema community')}`,
  ];

  for (const event of events) {
    lines.push(...buildIcsEvent(event, siteUrl));
  }

  lines.push('END:VCALENDAR');

  // Per RFC 5545, lines must be CRLF terminated
  return lines.join('\r\n') + '\r\n';
}
