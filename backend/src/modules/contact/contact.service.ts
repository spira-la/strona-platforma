import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { ContactMessageEntity } from '../../db/entities/contact.entity.js';
import { EmailService } from '../email/email.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

const CACHE_KEY_ALL = 'contact-messages:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type ContactMessage = ContactMessageEntity;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUBJECT_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  terapia: 'Terapia',
  strona: 'Strona internetowa',
  wspolpraca: 'Współpraca',
  inne: 'Inne',
};

/** Escapes characters that have special meaning in HTML to prevent XSS. */
function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

interface EmailFields {
  fullName: string;
  email: string;
  phone: string | null;
  subjectLabel: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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

    // Build email field set once, reused by both templates.
    const fields: EmailFields = {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      subjectLabel: SUBJECT_LABELS[dto.subject] ?? dto.subject,
      message: dto.message,
    };

    // Notification emails. Failures are warnings — the row is already saved
    // so the admin sees it in the panel even if SMTP has issues.
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
  // Email templates — Spirala visual identity
  //
  // Inline styles only (most clients strip <style>). Tables wrap the content
  // for Outlook compatibility. Web fonts fall back to Georgia / Arial since
  // many clients block @font-face.
  // -------------------------------------------------------------------------

  private buildAdminHtml(f: EmailFields): string {
    const safeName = escapeHtml(f.fullName);
    const safeEmail = escapeHtml(f.email);
    const safePhone = f.phone ? escapeHtml(f.phone) : '—';
    const safeSubject = escapeHtml(f.subjectLabel);
    const safeMessage = escapeHtml(f.message).replaceAll('\n', '<br>');

    return this.wrapWithLayout({
      preheader: `Nowa wiadomość kontaktowa od ${safeName}`,
      title: 'Nowa wiadomość kontaktowa',
      subtitle: 'Ktoś napisał przez formularz na stronie',
      body: `
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          ${this.row('Imię i nazwisko', safeName)}
          ${this.row('E-mail', `<a href="mailto:${safeEmail}" style="color: #B8963E; text-decoration: none;">${safeEmail}</a>`)}
          ${this.row('Telefon', safePhone)}
          ${this.row('Temat', safeSubject)}
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

    return this.wrapWithLayout({
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
          Z ciepłem,<br>
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
      'Z ciepłem,',
      'Aneta Mroczko — Spirala',
      'https://spira-la.com',
    ].join('\n');
  }

  /**
   * Shared Spirala-branded layout: gold gradient header, cream body,
   * subtle footer. All inline styles for maximum email-client support.
   */
  private wrapWithLayout(opts: {
    preheader: string;
    title: string;
    subtitle: string;
    body: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: 'Lato', Arial, sans-serif;">
  <span style="display: none; font-size: 0; line-height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; visibility: hidden;">
    ${escapeHtml(opts.preheader)}
  </span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F6F0;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #B8963E 0%, #D4B96A 100%); padding: 32px 32px 28px;">
              <p style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.04em;">
                Spirala
              </p>
              <p style="margin: 4px 0 0; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.92); letter-spacing: 0.04em; text-transform: uppercase;">
                ${escapeHtml(opts.subtitle)}
              </p>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding: 32px 32px 0;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700; color: #2D2D2D; line-height: 1.2;">
                ${escapeHtml(opts.title)}
              </h1>
              <div style="width: 40px; height: 2px; background: #B8963E; margin: 16px 0 24px;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px; background: #F9F6F0;">
              ${opts.body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #EDE8DC; border-top: 1px solid #E8E4DF;">
              <p style="margin: 0 0 4px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-weight: 700; color: #2D2D2D;">
                Spirala
              </p>
              <p style="margin: 0 0 8px; font-family: 'Lato', Arial, sans-serif; font-size: 12px; color: #6B6B6B; line-height: 1.6;">
                Coaching i terapia online — Aneta Mroczko
              </p>
              <p style="margin: 0; font-family: 'Lato', Arial, sans-serif; font-size: 12px; color: #8A8A8A;">
                <a href="https://spira-la.com" style="color: #B8963E; text-decoration: none;">spira-la.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:contact@spira-la.com" style="color: #B8963E; text-decoration: none;">contact@spira-la.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private row(label: string, value: string): string {
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DF; font-family: 'Lato', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8A8A8A; font-weight: 600; width: 140px; vertical-align: top;">${label}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DF; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D;">${value}</td>
      </tr>
    `;
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
