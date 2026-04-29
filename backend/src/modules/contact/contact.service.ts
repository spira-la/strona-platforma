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
      name: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      message: dto.message,
      isRead: false,
    });

    const saved = await this.repo.save(entity);

    // Invalidate admin list cache so the new message is visible immediately.
    this.cache.delete(CACHE_KEY_ALL);

    // Send notification email — failure must NOT affect the HTTP response.
    const notificationTarget =
      this.config.get<string>('CONTACT_NOTIFICATION_EMAIL') ??
      'contact@spira-la.com';

    const subjectLabel = SUBJECT_LABELS[dto.subject] ?? dto.subject;
    const emailSubject = `[Spirala Kontakt] ${subjectLabel} — ${dto.fullName}`;

    const safeName = escapeHtml(dto.fullName);
    const safeEmail = escapeHtml(dto.email);
    const safePhone = dto.phone ? escapeHtml(dto.phone) : '—';
    const safeSubject = escapeHtml(subjectLabel);
    const safeMessage = escapeHtml(dto.message).replaceAll('\n', '<br>');

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #B8963E;">Nowa wiadomość kontaktowa — Spirala</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px; font-weight: bold; width: 130px;">Imię i nazwisko:</td>
      <td style="padding: 8px;">${safeName}</td>
    </tr>
    <tr style="background: #f9f6f0;">
      <td style="padding: 8px; font-weight: bold;">E-mail:</td>
      <td style="padding: 8px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold;">Telefon:</td>
      <td style="padding: 8px;">${safePhone}</td>
    </tr>
    <tr style="background: #f9f6f0;">
      <td style="padding: 8px; font-weight: bold;">Temat:</td>
      <td style="padding: 8px;">${safeSubject}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; vertical-align: top;">Wiadomość:</td>
      <td style="padding: 8px;">${safeMessage}</td>
    </tr>
  </table>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">
    Odpowiadając na ten e-mail, Twoja odpowiedź zostanie wysłana bezpośrednio do nadawcy.
  </p>
</div>
    `.trim();

    const text = [
      'Nowa wiadomość kontaktowa — Spirala',
      '',
      `Imię i nazwisko: ${dto.fullName}`,
      `E-mail: ${dto.email}`,
      `Telefon: ${dto.phone ?? '—'}`,
      `Temat: ${subjectLabel}`,
      '',
      'Wiadomość:',
      dto.message,
    ].join('\n');

    try {
      await this.emailService.sendMail({
        to: notificationTarget,
        subject: emailSubject,
        html,
        text,
        replyTo: dto.email,
      });
    } catch (error) {
      this.logger.warn(
        `Contact notification email failed (id: ${saved.id}): ${(error as Error).message}`,
      );
    }

    return saved;
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
