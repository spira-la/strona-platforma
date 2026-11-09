import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import {
  escapeHtml,
  kvRow,
  wrapWithSpiralaLayout,
} from '../../core/email-templates.util.js';
import {
  EventEntity,
  EventRegistrationEntity,
} from '../../db/entities/event.entity.js';
import { EmailService } from '../email/email.service.js';
import type {
  CreateEventDto,
  CreateEventRegistrationDto,
  UpdateEventDto,
} from './dto/event.dto.js';

/**
 * Error codes returned in `message` for the public sign-up endpoint. The
 * frontend maps them to CMS-editable texts (PL/EN/ES), so keep them stable.
 */
export const REGISTRATION_ERRORS = {
  NOT_FOUND: 'EVENT_NOT_FOUND',
  CLOSED: 'REGISTRATION_CLOSED',
  FULL: 'EVENT_FULL',
  DUPLICATE: 'ALREADY_REGISTERED',
} as const;

/** Events stay listed until this long after they started (or ended). */
const LISTING_GRACE_MS = 6 * 60 * 60 * 1000; // 6 hours

const TIME_ZONE = 'Europe/Warsaw';

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  isOnline: boolean;
  priceLabel: string | null;
  imageUrl: string | null;
  capacity: number | null;
  /** null when there is no capacity limit. */
  spotsLeft: number | null;
  registrationOpen: boolean;
}

export interface AdminEvent extends EventEntity {
  registrationsCount: number;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly events: Repository<EventEntity>,
    @InjectRepository(EventRegistrationEntity)
    private readonly registrations: Repository<EventRegistrationEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // Public
  // -------------------------------------------------------------------------

  /** Published events that have not finished yet, soonest first. */
  async findUpcoming(): Promise<PublicEvent[]> {
    const since = new Date(Date.now() - LISTING_GRACE_MS);
    // OR: started recently / in the future, or a longer event still running.
    const rows = await this.events.find({
      where: [
        { isPublished: true, startsAt: MoreThanOrEqual(since) },
        { isPublished: true, endsAt: MoreThanOrEqual(since) },
      ],
      order: { startsAt: 'ASC' },
    });

    const counts = await this.countRegistrations(rows.map((e) => e.id));

    return rows.map((e) => {
      const taken = counts.get(e.id) ?? 0;
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        location: e.location,
        isOnline: e.isOnline,
        priceLabel: e.priceLabel,
        imageUrl: e.imageUrl,
        capacity: e.capacity,
        spotsLeft: e.capacity === null ? null : Math.max(0, e.capacity - taken),
        registrationOpen: e.registrationOpen,
      };
    });
  }

  /**
   * Signs someone up. Locks the event row so two people cannot take the last
   * spot at the same time; a unique (event, email) index blocks duplicates.
   */
  async register(
    eventId: string,
    dto: CreateEventRegistrationDto,
  ): Promise<{ registration: EventRegistrationEntity; event: EventEntity }> {
    const email = dto.email.trim().toLowerCase();

    const result = await this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(EventEntity, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!event || !event.isPublished) {
        throw new NotFoundException(REGISTRATION_ERRORS.NOT_FOUND);
      }
      const finishedAt = (event.endsAt ?? event.startsAt).getTime();
      if (!event.registrationOpen || finishedAt < Date.now()) {
        throw new BadRequestException(REGISTRATION_ERRORS.CLOSED);
      }

      const existing = await manager.exists(EventRegistrationEntity, {
        where: { eventId, email },
      });
      if (existing) {
        throw new ConflictException(REGISTRATION_ERRORS.DUPLICATE);
      }

      if (event.capacity !== null) {
        const taken = await manager.count(EventRegistrationEntity, {
          where: { eventId },
        });
        if (taken >= event.capacity) {
          throw new ConflictException(REGISTRATION_ERRORS.FULL);
        }
      }

      const registration = await manager.save(
        manager.create(EventRegistrationEntity, {
          eventId,
          fullName: dto.fullName.trim(),
          email,
          phone: dto.phone?.trim() || null,
          message: dto.message?.trim() || null,
        }),
      );
      return { registration, event };
    });

    await this.sendRegistrationEmails(result.event, result.registration);
    return result;
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  async findAllForAdmin(): Promise<AdminEvent[]> {
    const rows = await this.events.find({ order: { startsAt: 'DESC' } });
    const counts = await this.countRegistrations(rows.map((e) => e.id));
    return rows.map((e) =>
      Object.assign(e, { registrationsCount: counts.get(e.id) ?? 0 }),
    );
  }

  async create(dto: CreateEventDto): Promise<EventEntity> {
    const entity = this.events.create(this.toColumns(dto));
    this.assertDates(entity.startsAt, entity.endsAt ?? null);
    return this.events.save(entity);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.events.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    Object.assign(event, this.toColumns(dto));
    this.assertDates(event.startsAt, event.endsAt);
    return this.events.save(event);
  }

  async remove(id: string): Promise<void> {
    const res = await this.events.delete({ id });
    if (!res.affected) throw new NotFoundException('Event not found');
  }

  async findRegistrations(eventId: string): Promise<EventRegistrationEntity[]> {
    const exists = await this.events.exists({ where: { id: eventId } });
    if (!exists) throw new NotFoundException('Event not found');
    return this.registrations.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  async removeRegistration(id: string): Promise<void> {
    const res = await this.registrations.delete({ id });
    if (!res.affected) throw new NotFoundException('Registration not found');
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async countRegistrations(
    ids: string[],
  ): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.registrations
      .createQueryBuilder('r')
      .select('r.event_id', 'eventId')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.event_id IN (:...ids)', { ids })
      .groupBy('r.event_id')
      .getRawMany<{ eventId: string; count: number }>();
    return new Map(rows.map((r) => [r.eventId, Number(r.count)]));
  }

  /** Maps DTO fields to entity columns, normalising empty strings to null. */
  private toColumns(dto: UpdateEventDto): Partial<EventEntity> {
    const out: Partial<EventEntity> = {};
    const text = (v: string | null | undefined) =>
      v === undefined ? undefined : v?.trim() || null;

    if (dto.title !== undefined) out.title = dto.title.trim();
    if (dto.description !== undefined)
      out.description = text(dto.description) ?? null;
    if (dto.startsAt !== undefined) out.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined)
      out.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.location !== undefined) out.location = text(dto.location) ?? null;
    if (dto.isOnline !== undefined) out.isOnline = dto.isOnline;
    if (dto.priceLabel !== undefined)
      out.priceLabel = text(dto.priceLabel) ?? null;
    if (dto.capacity !== undefined) out.capacity = dto.capacity ?? null;
    if (dto.imageUrl !== undefined) out.imageUrl = text(dto.imageUrl) ?? null;
    if (dto.isPublished !== undefined) out.isPublished = dto.isPublished;
    if (dto.registrationOpen !== undefined)
      out.registrationOpen = dto.registrationOpen;
    return out;
  }

  private assertDates(startsAt: Date, endsAt: Date | null): void {
    if (endsAt && endsAt.getTime() < startsAt.getTime()) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
  }

  private formatWhen(event: EventEntity): string {
    const date = new Intl.DateTimeFormat('pl-PL', {
      timeZone: TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(event.startsAt);
    const time = (d: Date) =>
      new Intl.DateTimeFormat('pl-PL', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    const end = event.endsAt ? `–${time(event.endsAt)}` : '';
    return `${date}, ${time(event.startsAt)}${end}`;
  }

  private formatWhere(event: EventEntity): string {
    if (event.isOnline)
      return event.location ? `Online — ${event.location}` : 'Online';
    return event.location ?? '—';
  }

  // -------------------------------------------------------------------------
  // E-mails (failures only log — the sign-up is already saved and visible
  // in the admin panel)
  // -------------------------------------------------------------------------

  private async sendRegistrationEmails(
    event: EventEntity,
    reg: EventRegistrationEntity,
  ): Promise<void> {
    const adminTarget =
      this.config.get<string>('CONTACT_NOTIFICATION_EMAIL') ??
      'contact@spira-la.com';
    const when = this.formatWhen(event);
    const where = this.formatWhere(event);
    const safe = {
      title: escapeHtml(event.title),
      when: escapeHtml(when),
      where: escapeHtml(where),
      price: event.priceLabel ? escapeHtml(event.priceLabel) : null,
      name: escapeHtml(reg.fullName),
      email: escapeHtml(reg.email),
      phone: reg.phone ? escapeHtml(reg.phone) : '—',
      message: reg.message
        ? escapeHtml(reg.message).replaceAll('\n', '<br>')
        : null,
      firstName: escapeHtml(reg.fullName.split(/\s+/)[0] ?? reg.fullName),
    };
    const p = (html: string) =>
      `<p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #3F3044; line-height: 1.7;">${html}</p>`;
    const details = `
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        ${kvRow('Wydarzenie', `<strong>${safe.title}</strong>`)}
        ${kvRow('Kiedy', safe.when)}
        ${kvRow('Gdzie', safe.where)}
        ${safe.price ? kvRow('Cena', safe.price) : ''}
      </table>`;

    try {
      await this.emailService.sendMail({
        to: adminTarget,
        subject: `[Spirala Wydarzenia] Nowy zapis: ${event.title} — ${reg.fullName}`,
        replyTo: reg.email,
        html: wrapWithSpiralaLayout({
          preheader: `${safe.name} zapisał(a) się na ${safe.title}`,
          title: 'Nowy zapis na wydarzenie',
          subtitle: 'Ktoś zapisał się przez stronę',
          body: `
            ${details}
            <table style="width: 100%; border-collapse: collapse; margin: 0;">
              ${kvRow('Imię i nazwisko', safe.name)}
              ${kvRow('E-mail', `<a href="mailto:${safe.email}" style="color: #C2461A; text-decoration: none;">${safe.email}</a>`)}
              ${kvRow('Telefon', safe.phone)}
              ${safe.message ? kvRow('Wiadomość', safe.message) : ''}
            </table>
            ${p('<br>Odpowiadając na ten e-mail, piszesz bezpośrednio do tej osoby. Wszystkie zapisy widzisz w panelu: Wydarzenia → Zapisy.')}
          `,
        }),
        text: [
          `Nowy zapis na wydarzenie: ${event.title}`,
          `Kiedy: ${when}`,
          `Gdzie: ${where}`,
          '',
          `Imię i nazwisko: ${reg.fullName}`,
          `E-mail: ${reg.email}`,
          `Telefon: ${reg.phone ?? '—'}`,
          reg.message ? `Wiadomość: ${reg.message}` : '',
        ].join('\n'),
      });
    } catch (error) {
      this.logger.warn(
        `Admin event-registration email failed (reg ${reg.id}): ${(error as Error).message}`,
      );
    }

    try {
      await this.emailService.sendMail({
        to: reg.email,
        subject: `Jesteś zapisana/y: ${event.title} — Spirala`,
        replyTo: adminTarget,
        html: wrapWithSpiralaLayout({
          preheader: `Dziękuję za zapis na ${safe.title}`,
          title: 'Dziękuję za zapis!',
          subtitle: 'Do zobaczenia',
          body: `
            ${p(`Cześć <strong>${safe.firstName}</strong>,`)}
            ${p('cieszę się, że będziesz z nami. Twój zapis dotarł — oto szczegóły:')}
            ${details}
            ${p('Przed wydarzeniem napiszę do Ciebie z praktycznymi informacjami. Jeśli masz pytania albo chcesz zrezygnować, po prostu odpowiedz na tego maila.')}
            <p style="margin: 32px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #3F3044; font-style: italic;">
              Z radością,<br><strong style="font-style: normal;">Aneta Mroczko</strong>
            </p>
          `,
        }),
        text: [
          `Cześć ${reg.fullName.split(/\s+/)[0] ?? reg.fullName},`,
          '',
          'cieszę się, że będziesz z nami. Twój zapis dotarł:',
          `${event.title}`,
          `Kiedy: ${when}`,
          `Gdzie: ${where}`,
          event.priceLabel ? `Cena: ${event.priceLabel}` : '',
          '',
          'Przed wydarzeniem napiszę do Ciebie z praktycznymi informacjami.',
          'Jeśli masz pytania albo chcesz zrezygnować, odpowiedz na tego maila.',
          '',
          'Z radością,',
          'Aneta Mroczko',
        ].join('\n'),
      });
    } catch (error) {
      this.logger.warn(
        `Event-registration confirmation failed (reg ${reg.id}): ${(error as Error).message}`,
      );
    }
  }
}
