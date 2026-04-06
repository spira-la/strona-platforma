import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — email sending disabled');
      return;
    }

    const port = this.config.get<number>('SMTP_PORT') ?? 465;

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`SMTP configured: ${host}:${port} as ${user}`);
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (SMTP disabled): ${options.subject}`);
      return;
    }

    const from = `"${this.config.get('SMTP_FROM_NAME') ?? 'Spirala'}" <${this.config.get('SMTP_FROM_EMAIL') ?? this.config.get('SMTP_USER')}>`;

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
      return true;
    } catch (err) {
      this.logger.error('SMTP connection failed', (err as Error).message);
      return false;
    }
  }
}
