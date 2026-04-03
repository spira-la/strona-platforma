import {
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { spiralaSchema } from './pg-schema.js';

export const invoices = spiralaSchema.table(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id),
    invoiceNumber: text('invoice_number').unique().notNull(),
    recipientName: text('recipient_name'),
    recipientEmail: text('recipient_email'),
    recipientCompany: text('recipient_company'),
    recipientTaxId: text('recipient_tax_id'),
    recipientAddress: text('recipient_address'),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxCents: integer('tax_cents').default(0),
    totalCents: integer('total_cents').notNull(),
    currency: text('currency').default('PLN'),
    pdfUrl: text('pdf_url'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('invoices_order_id_idx').on(table.orderId),
    index('invoices_invoice_number_idx').on(table.invoiceNumber),
  ],
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
