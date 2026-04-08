import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_HOST: z.string().min(1, 'DATABASE_HOST is required'),
  DATABASE_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5432))
    .pipe(z.number().int()),
  DATABASE_USER: z.string().min(1, 'DATABASE_USER is required'),
  DATABASE_PASSWORD: z.string().min(1, 'DATABASE_PASSWORD is required'),
  DATABASE_NAME: z.string().min(1, 'DATABASE_NAME is required'),
  DATABASE_SCHEMA: z.string().optional(),
  DATABASE_SSL: z.string().optional(),

  // Server
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3000))
    .pipe(z.number().int().min(1).max(65535)),

  // Supabase (optional until auth is configured)
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),

  // Cloudflare R2
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // SMTP (Zoho)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 465))
    .pipe(z.number().int()),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Cloudflare Cache (optional — cache purge disabled if not set)
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  SITE_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validation function for NestJS ConfigModule.forRoot({ validate }).
 * Throws on missing required variables so the app fails fast at startup.
 */
export function validate(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    // Zod 4 uses .issues instead of .errors
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}
