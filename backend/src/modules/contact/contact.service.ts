import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import {
  escapeHtml,
  kvRow,
  wrapWithSpiralaLayout,
} from '../../core/email-templates.util.js';
import { ContactMessageEntity } from '../../db/entities/contact.entity.js';
import { EmailService } from '../email/email.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

const CACHE_KEY_ALL = 'contact-messages:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type ContactMessage = ContactMessageEntity;

const SUBJECT_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  terapia: 'Terapia',
  strona: 'Strona internetowa',
  wspolpraca: 'Współpraca',
  inne: 'Inne',
};

interface EmailFields {
  fullName: string;
  email: string;
  phone: string | null;
  subjectLabel: string;
  message: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly repo: Repository<ContactMessageEntity>,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateContactMessageDto): Promise<ContactMessage> {
    const entity = this.repo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      subject: dto.subject,
      message: dto.message,
      isRead: false,
    });

    const saved = await this.repo.save(entity);

    // Invalidate admin list cache so the new message is visible immediately.
    this.cache.delete(CACHE_KEY_ALL);

    const fields: EmailFields = {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      subjectLabel: SUBJECT_LABELS[dto.subject] ?? dto.subject,
      message: dto.message,
    };

    // Notification emails. Failures only log a warning — the row is already
    // saved, so the admin sees the message in the panel even if SMTP breaks.
    const notificationTarget =
      this.config.get<string>('CONTACT_NOTIFICATION_EMAIL') ??
      'contact@spira-la.com';

    try {
      await this.emailService.sendMail({
        to: notificationTarget,
        subject: `[Spirala Kontakt] ${fields.subjectLabel} — ${fields.fullName}`,
        html: this.buildAdminHtml(fields),
        text: this.buildAdminText(fields),
        replyTo: dto.email,
      });
    } catch (error) {
      this.logger.warn(
        `Admin notification email failed (id: ${saved.id}): ${(error as Error).message}`,
      );
    }

    try {
      await this.emailService.sendMail({
        to: dto.email,
        subject: 'Otrzymaliśmy Twoją wiadomość — Spirala',
        html: this.buildUserConfirmationHtml(fields),
        text: this.buildUserConfirmationText(fields),
        replyTo: notificationTarget,
      });
    } catch (error) {
      this.logger.warn(
        `User confirmation email failed (id: ${saved.id}): ${(error as Error).message}`,
      );
    }

    return saved;
  }

  // -------------------------------------------------------------------------
  // Email templates
  // -------------------------------------------------------------------------

  private buildAdminHtml(f: EmailFields): string {
    const safeName = escapeHtml(f.fullName);
    const safeEmail = escapeHtml(f.email);
    const safePhone = f.phone ? escapeHtml(f.phone) : '—';
    const safeSubject = escapeHtml(f.subjectLabel);
    const safeMessage = escapeHtml(f.message).replaceAll('\n', '<br>');

    return wrapWithSpiralaLayout({
      preheader: `Nowa wiadomość kontaktowa od ${safeName}`,
      title: 'Nowa wiadomość kontaktowa',
      subtitle: 'Ktoś napisał przez formularz na stronie',
      body: `
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          ${kvRow('Imię i nazwisko', safeName)}
          ${kvRow('E-mail', `<a href="mailto:${safeEmail}" style="color: #B8963E; text-decoration: none;">${safeEmail}</a>`)}
          ${kvRow('Telefon', safePhone)}
          ${kvRow('Temat', safeSubject)}
        </table>
        <div style="margin-top: 24px; padding: 20px; background: #FFFFFF; border-left: 3px solid #B8963E; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-family: 'Lato', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A8A8A; font-weight: 600;">Wiadomość</p>
          <p style="margin: 0; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">${safeMessage}</p>
        </div>
        <p style="margin: 24px 0 0; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: #6B6B6B;">
          Odpowiadając na ten e-mail, Twoja odpowiedź zostanie wysłana bezpośrednio do <strong>${safeName}</strong>.
        </p>
      `,
    });
  }

  private buildAdminText(f: EmailFields): string {
    return [
      'Nowa wiadomość kontaktowa — Spirala',
      ''.padEnd(40, '-'),
      `Imię i nazwisko : ${f.fullName}`,
      `E-mail          : ${f.email}`,
      `Telefon         : ${f.phone ?? '—'}`,
      `Temat           : ${f.subjectLabel}`,
      '',
      'Wiadomość:',
      f.message,
      '',
      ''.padEnd(40, '-'),
      `Odpowiedz bezpośrednio na ten e-mail — odpowiedź trafi do ${f.email}.`,
    ].join('\n');
  }

  private buildUserConfirmationHtml(f: EmailFields): string {
    const safeSubject = escapeHtml(f.subjectLabel);
    const safeMessage = escapeHtml(f.message).replaceAll('\n', '<br>');
    const firstName = f.fullName.split(/\s+/)[0] ?? f.fullName;
    const safeFirstName = escapeHtml(firstName);

    return wrapWithSpiralaLayout({
      preheader: 'Dziękujemy za wiadomość — odpowiemy w ciągu 24 godzin',
      title: 'Dziękujemy za wiadomość',
      subtitle: 'Otrzymaliśmy Twoje zapytanie',
      body: `
        <p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;">
          Cześć <strong>${safeFirstName}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
          Dziękuję za to, że napisałaś/eś do mnie. To pierwszy krok — odpowiem osobiście w ciągu <strong>24 godzin</strong>, a w weekend najpóźniej w poniedziałek rano.
        </p>
        <p style="margin: 0 0 24px; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D; line-height: 1.7;">
          Jeśli sprawa jest pilna, możesz też napisać bezpośrednio na <a href="mailto:contact@spira-la.com" style="color: #B8963E; text-decoration: none;">contact@spira-la.com</a>.
        </p>
        <div style="margin: 0 0 24px; padding: 20px; background: #FFFFFF; border-left: 3px solid #D4B96A; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-family: 'Lato', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A8A8A; font-weight: 600;">Twoja wiadomość</p>
          <p style="margin: 0 0 12px; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: #6B6B6B;">Temat: <strong style="color: #2D2D2D;">${safeSubject}</strong></p>
          <p style="margin: 0; font-family: 'Lato', Arial, sans-serif; font-size: 14px; color: #2D2D2D; line-height: 1.7; font-style: italic;">${safeMessage}</p>
        </div>
        <p style="margin: 32px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #2D2D2D; font-style: italic;">
          Z pozdrowieniem,<br>
          <strong style="font-style: normal;">Aneta Mroczko</strong>
        </p>
      `,
    });
  }

  private buildUserConfirmationText(f: EmailFields): string {
    const firstName = f.fullName.split(/\s+/)[0] ?? f.fullName;
    return [
      `Cześć ${firstName},`,
      '',
      'Dziękuję za to, że napisałaś/eś do mnie. To pierwszy krok — odpowiem',
      'osobiście w ciągu 24 godzin, a w weekend najpóźniej w poniedziałek rano.',
      '',
      'Jeśli sprawa jest pilna, możesz też napisać bezpośrednio na',
      'contact@spira-la.com.',
      '',
      ''.padEnd(40, '-'),
      `Temat: ${f.subjectLabel}`,
      '',
      'Twoja wiadomość:',
      f.message,
      ''.padEnd(40, '-'),
      '',
      'Z pozdrowieniem,',
      'Aneta Mroczko — Spirala',
      'https://spira-la.com',
    ].join('\n');
  }

  async findAll(): Promise<ContactMessage[]> {
    const cached = this.cache.get<ContactMessage[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { createdAt: 'DESC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<ContactMessage> {
    const message = await this.repo.findOne({ where: { id } });

    if (!message) {
      throw new NotFoundException(`Contact message with id "${id}" not found`);
    }

    return message;
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    await this.findById(id);
    await this.repo.update({ id }, { isRead: true });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async markAsUnread(id: string): Promise<ContactMessage> {
    await this.findById(id);
    await this.repo.update({ id }, { isRead: false });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.delete({ id });
    this.cache.delete(CACHE_KEY_ALL);
  }
}
