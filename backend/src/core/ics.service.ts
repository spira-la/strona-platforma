import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface IcsEventInput {
  uid?: string;
  sequence?: number;
  method?: 'REQUEST' | 'CANCEL' | 'PUBLISH';
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendees?: Array<{ name?: string; email: string }>;
}

/**
 * Minimal RFC 5545 iCalendar generator.
 * Emits a single VEVENT inside a VCALENDAR so it can be attached to a
 * transactional email (clients add the event to their calendar on open).
 */
@Injectable()
export class IcsService {
  private formatDate(d: Date): string {
    return d
      .toISOString()
      .replaceAll(/[-:]/g, '')
      .replace(/\.\d{3}/, ''); // strip millis
  }

  private escapeText(s: string): string {
    return s
      .replaceAll('\\', '\\\\')
      .replaceAll(';', String.raw`\;`)
      .replaceAll(',', String.raw`\,`)
      .replaceAll(/\r?\n/g, String.raw`\n`);
  }

  private fold(line: string): string {
    // RFC 5545 — lines SHOULD NOT be longer than 75 octets.
    if (line.length <= 75) return line;
    const parts: string[] = [];
    let i = 0;
    while (i < line.length) {
      parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 74));
      i += 74;
    }
    return parts.join('\r\n');
  }

  build(event: IcsEventInput): string {
    const uid = event.uid ?? `${randomUUID()}@spirala`;
    const method = event.method ?? 'REQUEST';
    const seq = event.sequence ?? 0;

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Spirala//Booking//EN',
      'CALSCALE:GREGORIAN',
      `METHOD:${method}`,
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `SEQUENCE:${seq}`,
      `DTSTAMP:${this.formatDate(new Date())}`,
      `DTSTART:${this.formatDate(event.start)}`,
      `DTEND:${this.formatDate(event.end)}`,
      `SUMMARY:${this.escapeText(event.summary)}`,
      `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
      'TRANSP:OPAQUE',
    ];

    if (event.description) {
      lines.push(`DESCRIPTION:${this.escapeText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${this.escapeText(event.location)}`);
    }
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }
    if (event.organizerEmail) {
      const cn = event.organizerName
        ? `;CN=${this.escapeText(event.organizerName)}`
        : '';
      lines.push(`ORGANIZER${cn}:MAILTO:${event.organizerEmail}`);
    }
    for (const att of event.attendees ?? []) {
      const cn = att.name ? `;CN=${this.escapeText(att.name)}` : '';
      lines.push(
        `ATTENDEE${cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:MAILTO:${att.email}`,
      );
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.map((l) => this.fold(l)).join('\r\n');
  }

  buildAttachment(event: IcsEventInput, filename = 'invite.ics') {
    return {
      filename,
      content: this.build(event),
      contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
    };
  }
}
