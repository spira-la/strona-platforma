import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'invoices' })
@Index('invoices_order_id_idx', ['orderId'])
@Index('invoices_invoice_number_idx', ['invoiceNumber'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ name: 'invoice_number', type: 'text', unique: true })
  invoiceNumber: string;

  @Column({ name: 'recipient_name', type: 'text', nullable: true })
  recipientName: string | null;

  @Column({ name: 'recipient_email', type: 'text', nullable: true })
  recipientEmail: string | null;

  @Column({ name: 'recipient_company', type: 'text', nullable: true })
  recipientCompany: string | null;

  @Column({ name: 'recipient_tax_id', type: 'text', nullable: true })
  recipientTaxId: string | null;

  @Column({ name: 'recipient_address', type: 'text', nullable: true })
  recipientAddress: string | null;

  @Column({ name: 'subtotal_cents', type: 'int' })
  subtotalCents: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0, nullable: true })
  taxCents: number | null;

  @Column({ name: 'total_cents', type: 'int' })
  totalCents: number;

  @Column({ type: 'text', default: 'PLN', nullable: true })
  currency: string | null;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string | null;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt: Date | null;
}
