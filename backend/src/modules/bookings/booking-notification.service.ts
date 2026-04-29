import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { EmailService } from '../email/email.service.js';
import { IcsService } from '../../core/ics.service.js';

export interface NotificationContext {
  booking: BookingEntity;
  service?: CoachingServiceEntity | null;
  customerEmail: string;
  customerName: string;
  coachName?: string | null;
  coachEmail?: string | null;
}

@Injectable()
export class BookingNotificationService {
  private readonly logger = new Logger(BookingNotificationService.name);

  constructor(
    @InjectRepository(CoachingServiceEntity)
    private readonly services: Repository<CoachingServiceEntity>,
    private readonly email: EmailService,
    private readonly ics: IcsService,
    private readonly config: ConfigService,
  ) {}

  private get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'https://spira.la';
  }

  private get adminEmail(): string | null {
    return (
      this.config.get<string>('SMTP_FROM_EMAIL') ??
      this.config.get<string>('SMTP_USER') ??
      null
    );
  }

  private formatDateTime(d: Date, locale = 'pl-PL'): string {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Warsaw',
    }).format(d);
  }

  private buildClientHtml(
    ctx: NotificationContext,
    sessionLink: string,
  ): string {
    const { booking, service, customerName, coachName } = ctx;
    const when = this.formatDateTime(booking.startTime);
    const serviceName = service?.name ?? 'Session';
    return `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <div style="padding: 24px; background: linear-gradient(135deg, #B8963E 0%, #D4B96A 100%); color: white;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px;">Spirala</h1>
          <p style="margin: 8px 0 0; opacity: 0.95;">Your session is confirmed</p>
        </div>
        <div style="padding: 24px; background: #F9F6F0;">
          <p>Cześć ${this.escapeHtml(customerName)},</p>
          <p>Potwierdzamy Twoją rezerwację:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Usługa</td><td style="padding: 8px 0;"><strong>${this.escapeHtml(serviceName)}</strong></td></tr>
            ${coachName ? `<tr><td style="padding: 8px 0; color: #6b7280;">Coach</td><td style="padding: 8px 0;">${this.escapeHtml(coachName)}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #6b7280;">Termin</td><td style="padding: 8px 0;">${this.escapeHtml(when)}</td></tr>
          </table>
          <p style="margin: 24px 0;">
            <a href="${sessionLink}" style="display: inline-block; background: #B8963E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Dołącz do sesji
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Link do spotkania wideo działa od 5 minut przed rozpoczęciem sesji.</p>
          <p style="color: #6b7280; font-size: 13px;">Załącznik .ics dodaje wydarzenie do Twojego kalendarza (Google / Apple / Outlook).</p>
        </div>
      </div>
    `;
  }

  private buildAdminHtml(ctx: NotificationContext): string {
    const { booking, service, customerName, customerEmail } = ctx;
    const when = this.formatDateTime(booking.startTime);
    return `
      <div style="font-family: Inter, Arial, sans-serif;">
        <h2>Nowa rezerwacja</h2>
        <ul>
          <li><strong>Klient:</strong> ${this.escapeHtml(customerName)} (${this.escapeHtml(customerEmail)})</li>
          <li><strong>Usługa:</strong> ${this.escapeHtml(service?.name ?? '—')}</li>
          <li><strong>Termin:</strong> ${this.escapeHtml(when)}</li>
          <li><strong>Booking ID:</strong> ${booking.id}</li>
          <li><strong>Order ID:</strong> ${booking.orderId ?? '—'}</li>
        </ul>
      </div>
    `;
  }

  private escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  async sendConfirmation(ctx: NotificationContext): Promise<void> {
    try {
      const service =
        ctx.service ??
        (ctx.booking.serviceId
          ? await this.services.findOne({
              where: { id: ctx.booking.serviceId },
            })
          : null);

      const sessionLink =
        ctx.booking.meetingLink ??
        `${this.frontendUrl}/session/${ctx.booking.id}`;

      const icsAttachment = this.ics.buildAttachment(
        {
          uid: `booking-${ctx.booking.id}@spirala`,
          summary: `Spirala — ${service?.name ?? 'Session'}`,
          description: `Your Spirala session.\n\nJoin: ${sessionLink}`,
          url: sessionLink,
          start: ctx.booking.startTime,
          end: ctx.booking.endTime,
          organizerName: 'Spirala',
          organizerEmail: this.adminEmail ?? 'noreply@spira.la',
          attendees: [
            { name: ctx.customerName, email: ctx.customerEmail },
            ...(ctx.coachEmail
              ? [{ name: ctx.coachName ?? 'Coach', email: ctx.coachEmail }]
              : []),
          ],
        },
        `spirala-session-${ctx.booking.id}.ics`,
      );

      await this.email.sendMail({
        to: ctx.customerEmail,
        subject: `Potwierdzenie rezerwacji — ${service?.name ?? 'Spirala Session'}`,
        html: this.buildClientHtml({ ...ctx, service }, sessionLink),
        attachments: [icsAttachment],
      });

      if (this.adminEmail) {
        await this.email.sendMail({
          to: this.adminEmail,
          subject: `Nowa rezerwacja — ${service?.name ?? ''} — ${ctx.customerName}`,
          html: this.buildAdminHtml({ ...ctx, service }),
          attachments: [icsAttachment],
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation for ${ctx.booking.id}: ${(error as Error).message}`,
      );
    }
  }

  async sendRescheduled(
    ctx: NotificationContext,
    previousStart: Date,
  ): Promise<void> {
    try {
      const service =
        ctx.service ??
        (ctx.booking.serviceId
          ? await this.services.findOne({
              where: { id: ctx.booking.serviceId },
            })
          : null);

      const sessionLink =
        ctx.booking.meetingLink ??
        `${this.frontendUrl}/session/${ctx.booking.id}`;

      const icsAttachment = this.ics.buildAttachment(
        {
          uid: `booking-${ctx.booking.id}@spirala`,
          sequence: ctx.booking.rescheduleCount ?? 1,
          summary: `Spirala — ${service?.name ?? 'Session'}`,
          description: `Your Spirala session has been rescheduled.\n\nJoin: ${sessionLink}`,
          url: sessionLink,
          start: ctx.booking.startTime,
          end: ctx.booking.endTime,
          organizerName: 'Spirala',
          organizerEmail: this.adminEmail ?? 'noreply@spira.la',
          attendees: [{ name: ctx.customerName, email: ctx.customerEmail }],
        },
        `spirala-session-${ctx.booking.id}.ics`,
      );

      await this.email.sendMail({
        to: ctx.customerEmail,
        subject: `Sesja przeniesiona — ${this.formatDateTime(ctx.booking.startTime)}`,
        html: `
          <p>Cześć ${this.escapeHtml(ctx.customerName)},</p>
          <p>Twoja sesja została przeniesiona z <strong>${this.escapeHtml(this.formatDateTime(previousStart))}</strong> na <strong>${this.escapeHtml(this.formatDateTime(ctx.booking.startTime))}</strong>.</p>
          <p><a href="${sessionLink}">Dołącz do sesji</a></p>
        `,
        attachments: [icsAttachment],
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reschedule email for ${ctx.booking.id}: ${(error as Error).message}`,
      );
    }
  }
}
