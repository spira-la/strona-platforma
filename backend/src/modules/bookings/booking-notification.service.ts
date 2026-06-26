import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { EmailService } from '../email/email.service.js';
import { IcsService } from '../../core/ics.service.js';
import {
  escapeHtml,
  kvRow,
  wrapWithSpiralaLayout,
} from '../../core/email-templates.util.js';

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
    const safeName = escapeHtml(customerName);
    const firstName = customerName.split(/\s+/)[0] ?? customerName;

    return wrapWithSpiralaLayout({
      preheader: `Potwierdzenie rezerwacji — ${serviceName}, ${when}`,
      title: 'Twoja sesja jest potwierdzona',
      subtitle: 'Potwierdzenie rezerwacji',
      body: `
        <p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;">
          Cześć <strong>${escapeHtml(firstName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
          Potwierdzamy Twoją rezerwację. Szczegóły poniżej, a w załączniku znajdziesz plik <strong>.ics</strong> do dodania wydarzenia do kalendarza.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
          ${kvRow('Usługa', `<strong>${escapeHtml(serviceName)}</strong>`)}
          ${coachName ? kvRow('Coach', escapeHtml(coachName)) : ''}
          ${kvRow('Termin', escapeHtml(when))}
        </table>
        <p style="margin: 0 0 24px;">
          <a href="${sessionLink}" style="display: inline-block; background: #B8963E; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
            Dołącz do sesji
          </a>
        </p>
        <p style="margin: 0 0 8px; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: #6B6B6B; line-height: 1.6;">
          Link do spotkania wideo działa od <strong>5 minut</strong> przed rozpoczęciem sesji.
        </p>
        <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: #6B6B6B; line-height: 1.6;">
          Załącznik <strong>.ics</strong> dodaje wydarzenie do Twojego kalendarza (Google&nbsp;/&nbsp;Apple&nbsp;/&nbsp;Outlook).
        </p>
        <p style="margin: 32px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #2D2D2D; font-style: italic;">
          Z pozdrowieniem,<br>
          <strong style="font-style: normal;">Aneta Mroczko</strong>
        </p>
        <!-- Avoid unused-var lint when coachName is empty -->
        <span style="display:none;">${safeName}</span>
      `,
    });
  }

  private buildAdminHtml(ctx: NotificationContext): string {
    const { booking, service, customerName, customerEmail } = ctx;
    const when = this.formatDateTime(booking.startTime);

    return wrapWithSpiralaLayout({
      preheader: `Nowa rezerwacja — ${customerName}, ${when}`,
      title: 'Nowa rezerwacja',
      subtitle: 'Klient zarezerwował sesję',
      body: `
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          ${kvRow('Klient', `${escapeHtml(customerName)} <span style="color:#6B6B6B;">&lt;<a href="mailto:${escapeHtml(customerEmail)}" style="color:#B8963E;text-decoration:none;">${escapeHtml(customerEmail)}</a>&gt;</span>`)}
          ${kvRow('Usługa', escapeHtml(service?.name ?? '—'))}
          ${kvRow('Termin', escapeHtml(when))}
          ${kvRow('Booking ID', `<code style="font-family: monospace; font-size: 12px; color: #6B6B6B;">${escapeHtml(booking.id)}</code>`)}
          ${kvRow('Order ID', `<code style="font-family: monospace; font-size: 12px; color: #6B6B6B;">${escapeHtml(booking.orderId ?? '—')}</code>`)}
        </table>
      `,
    });
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
        ctx.booking.meetingUrl ??
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
        ctx.booking.meetingUrl ??
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

      const newWhen = this.formatDateTime(ctx.booking.startTime);
      const oldWhen = this.formatDateTime(previousStart);
      const firstName = ctx.customerName.split(/\s+/)[0] ?? ctx.customerName;

      await this.email.sendMail({
        to: ctx.customerEmail,
        subject: `Sesja przeniesiona — ${newWhen}`,
        html: wrapWithSpiralaLayout({
          preheader: `Twoja sesja została przeniesiona na ${newWhen}`,
          title: 'Sesja przeniesiona',
          subtitle: 'Zmiana terminu',
          body: `
            <p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;">
              Cześć <strong>${escapeHtml(firstName)}</strong>,
            </p>
            <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
              Twoja sesja została przeniesiona. Szczegóły:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
              ${kvRow('Poprzedni termin', `<span style="color:#8A8A8A;text-decoration:line-through;">${escapeHtml(oldWhen)}</span>`)}
              ${kvRow('Nowy termin', `<strong style="color:#B8963E;">${escapeHtml(newWhen)}</strong>`)}
            </table>
            <p style="margin: 0 0 24px;">
              <a href="${sessionLink}" style="display: inline-block; background: #B8963E; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
                Dołącz do sesji
              </a>
            </p>
            <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: #6B6B6B; line-height: 1.6;">
              Załącznik <strong>.ics</strong> zaktualizuje wydarzenie w Twoim kalendarzu.
            </p>
            <p style="margin: 32px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #2D2D2D; font-style: italic;">
              Z pozdrowieniem,<br>
              <strong style="font-style: normal;">Aneta Mroczko</strong>
            </p>
          `,
        }),
        attachments: [icsAttachment],
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reschedule email for ${ctx.booking.id}: ${(error as Error).message}`,
      );
    }
  }

  async sendCancellation(ctx: NotificationContext): Promise<void> {
    try {
      const service =
        ctx.service ??
        (ctx.booking.serviceId
          ? await this.services.findOne({
              where: { id: ctx.booking.serviceId },
            })
          : null);

      const sessionLink =
        ctx.booking.meetingUrl ??
        `${this.frontendUrl}/session/${ctx.booking.id}`;

      // METHOD:CANCEL removes the event from the client's calendar app
      const icsAttachment = this.ics.buildAttachment(
        {
          uid: `booking-${ctx.booking.id}@spirala`,
          method: 'CANCEL',
          sequence: (ctx.booking.rescheduleCount ?? 0) + 1,
          summary: `Spirala — ${service?.name ?? 'Session'}`,
          description: `Your Spirala session has been cancelled.\n\nOriginal link: ${sessionLink}`,
          url: sessionLink,
          start: ctx.booking.startTime,
          end: ctx.booking.endTime,
          organizerName: 'Spirala',
          organizerEmail: this.adminEmail ?? 'noreply@spira.la',
          attendees: [{ name: ctx.customerName, email: ctx.customerEmail }],
        },
        `spirala-cancellation-${ctx.booking.id}.ics`,
      );

      const when = this.formatDateTime(ctx.booking.startTime);
      const firstName = ctx.customerName.split(/\s+/)[0] ?? ctx.customerName;

      await this.email.sendMail({
        to: ctx.customerEmail,
        subject: `Sesja anulowana — ${when}`,
        html: wrapWithSpiralaLayout({
          preheader: `Twoja sesja ${service?.name ?? ''} na ${when} została anulowana`,
          title: 'Sesja anulowana',
          subtitle: 'Anulowanie rezerwacji',
          body: `
            <p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;">
              Cześć <strong>${escapeHtml(firstName)}</strong>,
            </p>
            <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
              Informujemy, że Twoja sesja została anulowana.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
              ${service ? kvRow('Usługa', escapeHtml(service.name)) : ''}
              ${ctx.coachName ? kvRow('Coach', escapeHtml(ctx.coachName)) : ''}
              ${kvRow('Termin', `<span style="color:#8A8A8A;text-decoration:line-through;">${escapeHtml(when)}</span>`)}
              ${ctx.booking.cancellationReason ? kvRow('Powód', escapeHtml(ctx.booking.cancellationReason)) : ''}
            </table>
            <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 14px; color: #6B6B6B; line-height: 1.7;">
              Załączony plik <strong>.ics</strong> automatycznie usunie wydarzenie z Twojego kalendarza.
            </p>
            <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 14px; color: #6B6B6B; line-height: 1.7;">
              Jeśli masz pytania, skontaktuj się z nami odpowiadając na tego maila.
            </p>
            <p style="margin: 32px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #2D2D2D; font-style: italic;">
              Z pozdrowieniem,<br>
              <strong style="font-style: normal;">Aneta Mroczko</strong>
            </p>
          `,
        }),
        attachments: [icsAttachment],
      });

      // Also notify the admin
      if (this.adminEmail) {
        await this.email.sendMail({
          to: this.adminEmail,
          subject: `Anulowanie sesji — ${ctx.customerName} — ${when}`,
          html: wrapWithSpiralaLayout({
            preheader: `Sesja ${ctx.customerName} na ${when} została anulowana`,
            title: 'Sesja anulowana',
            subtitle: 'Anulowanie przez coacha',
            body: `
              <table style="width: 100%; border-collapse: collapse; margin: 0;">
                ${kvRow('Klient', `${escapeHtml(ctx.customerName)} <span style="color:#6B6B6B;">&lt;<a href="mailto:${escapeHtml(ctx.customerEmail)}" style="color:#B8963E;text-decoration:none;">${escapeHtml(ctx.customerEmail)}</a>&gt;</span>`)}
                ${service ? kvRow('Usługa', escapeHtml(service.name)) : ''}
                ${kvRow('Termin', `<span style="text-decoration:line-through;">${escapeHtml(when)}</span>`)}
                ${ctx.booking.cancellationReason ? kvRow('Powód', escapeHtml(ctx.booking.cancellationReason)) : ''}
                ${kvRow('Booking ID', `<code style="font-family:monospace;font-size:12px;color:#6B6B6B;">${escapeHtml(ctx.booking.id)}</code>`)}
              </table>
            `,
          }),
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation email for ${ctx.booking.id}: ${(error as Error).message}`,
      );
    }
  }
}
