# Base de Datos - Firebase → Supabase/PostgreSQL

## Estrategia

Migrar de Firestore (NoSQL) a PostgreSQL (Supabase) para tener:
- Foreign keys reales (no más IDs sueltos sin integridad)
- JOINs en vez de múltiples queries
- Transacciones ACID
- Row Level Security (RLS) en vez de 859 líneas de Firestore rules
- Enums con CHECK constraints
- Arrays nativos de PostgreSQL
- Eliminar el patrón `_test` suffix → usar esquemas o entornos separados

## Schema PostgreSQL

### IMPORTANTE: Se mantienen TODAS las tablas necesarias para features ocultas

Aunque webinars, audio courses, etc. están ocultos, sus tablas existen en PostgreSQL para cuando se reactiven.

```sql
-- ============================================
-- CORE (siempre activo)
-- ============================================

-- Extiende auth.users de Supabase
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  timezone TEXT DEFAULT 'Europe/Warsaw',
  locale TEXT DEFAULT 'pl',
  avatar_url TEXT,
  role TEXT CHECK (role IN ('user', 'coach', 'admin')) DEFAULT 'user',
  disabled BOOLEAN DEFAULT false,
  disabled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags (controlados desde admin)
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SERVICIOS & BOOKING (activo en Spirala)
-- ============================================

CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[],
  languages TEXT[],
  location TEXT,
  website TEXT,
  timezone TEXT DEFAULT 'Europe/Warsaw',
  accepting_clients BOOLEAN DEFAULT true,
  stripe_connect_id TEXT,         -- Para cuando se reactive Stripe Connect
  years_experience INT,
  certifications TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coaching_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  session_count INT DEFAULT 1,    -- 1 = single, 4/8 = paquete
  price_cents INT NOT NULL,
  currency TEXT DEFAULT 'PLN',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES coaching_services(id),
  status TEXT CHECK (status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  amount_cents INT NOT NULL,
  tax_cents INT DEFAULT 0,
  currency TEXT DEFAULT 'PLN',
  stripe_payment_intent_id TEXT,
  sessions_total INT NOT NULL,
  sessions_remaining INT NOT NULL,
  invoice_number TEXT,
  coupon_id UUID REFERENCES coupons(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  coach_id UUID REFERENCES coaches(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'confirmed',
  meeting_link TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BLOG & NEWSLETTER (activo en Spirala)
-- ============================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  tags TEXT[],
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  coach_id UUID REFERENCES coaches(id),  -- Para multi-coach futuro
  status TEXT CHECK (status IN ('active', 'unsubscribed')) DEFAULT 'active',
  unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================
-- CONTACTO
-- ============================================

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- E-COMMERCE (cupones activos, invoices activos)
-- ============================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value INT NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  invoice_number TEXT UNIQUE NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_company TEXT,
  recipient_tax_id TEXT,
  recipient_address TEXT,
  subtotal_cents INT NOT NULL,
  tax_cents INT DEFAULT 0,
  total_cents INT NOT NULL,
  currency TEXT DEFAULT 'PLN',
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DIGITAL PRODUCTS (oculto, listo para reactivar)
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  product_type TEXT CHECK (product_type IN ('audio', 'ebook', 'bundle', 'youtube')),
  category_id UUID REFERENCES categories(id),
  cover_image_url TEXT,
  duration_minutes INT,
  language TEXT,
  tags TEXT[],
  price_cents INT,
  currency TEXT DEFAULT 'PLN',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES coaches(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  order_id UUID REFERENCES orders(id),
  status TEXT CHECK (status IN ('active', 'expired', 'refunded')) DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  current_position_seconds INT,
  current_page INT,
  chapters_completed TEXT[],
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  time_spent_minutes INT DEFAULT 0,
  UNIQUE(user_id, product_id)
);

-- ============================================
-- WEBINARS (oculto, listo para reactivar)
-- ============================================

CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  host_id UUID REFERENCES coaches(id),
  shadow_host_id UUID REFERENCES coaches(id),
  admin_speaker_ids UUID[],
  status TEXT CHECK (status IN ('draft', 'published', 'live', 'completed')) DEFAULT 'draft',
  max_participants INT,
  registered_count INT DEFAULT 0,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webinar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  session_number INT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'live', 'completed')) DEFAULT 'scheduled',
  livekit_room_name TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(webinar_id, user_id)
);

-- ============================================
-- GIFTS (oculto, listo para reactivar)
-- ============================================

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  sender_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT,
  redeem_code TEXT UNIQUE NOT NULL,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REVIEWS (oculto, listo para reactivar)
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  coach_id UUID REFERENCES coaches(id),
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (product_id IS NOT NULL OR coach_id IS NOT NULL)
);

-- ============================================
-- BLOG INTERACTIONS (oculto parcialmente)
-- ============================================

CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_bookings_coach_time ON bookings(coach_id, start_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_products_type ON products(product_type, is_published);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_availability_coach ON availability(coach_id, day_of_week);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

## Migración de datos

Si hay datos existentes en Firestore de BeWonderMe que necesitan migrar:

1. Exportar colecciones de Firestore a JSON
2. Script de transformación JSON → SQL INSERT
3. Mapear Firebase UIDs → Supabase Auth UIDs (o importar usuarios a Supabase Auth)
4. Ejecutar inserts en orden respetando FKs

## Entornos (reemplaza _test suffix)

En vez del patrón `collection_test` de Firestore:
- **Desarrollo**: Supabase local (supabase start) o proyecto dev en Supabase cloud
- **Staging**: Proyecto separado en Supabase cloud
- **Producción**: Proyecto separado en Supabase cloud

Cada entorno tiene su propia DB, auth, y storage. Sin suffixes.

## ORM: Drizzle ORM

**Drizzle ORM** por:
- Type-safe (genera tipos de TypeScript desde el schema)
- Migraciones automáticas
- Ligero (no como Prisma que genera un binary)
- Buen soporte para PostgreSQL + Supabase
- Schema as code (el schema de arriba se traduce directamente)

## Migraciones con Drizzle Kit

### Workflow

```
Cambio en schema/*.ts → generate → review SQL → migrate → commit
```

### Comandos

```bash
cd backend

# 1. Generar migración desde cambios en schema
npx drizzle-kit generate

# 2. Revisar el SQL generado en drizzle/*.sql (SIEMPRE revisar antes de aplicar)

# 3. Aplicar migraciones pendientes
npx drizzle-kit migrate

# 4. Explorar DB visualmente
npx drizzle-kit studio
```

### Estructura de archivos

```
backend/
├── src/db/schema/          # Schema as code (source of truth)
│   ├── enums.ts            # pgEnum definitions
│   ├── profiles.ts         # Core: users
│   ├── coaches.ts          # Core: coaches
│   ├── coaching-services.ts
│   ├── availability.ts     # availability + availability_blocks
│   ├── coupons.ts
│   ├── orders.ts
│   ├── bookings.ts
│   ├── invoices.ts
│   ├── blog.ts             # blog_posts + blog_comments
│   ├── newsletter.ts
│   ├── contact.ts
│   ├── products.ts         # categories + products [HIDDEN]
│   ├── purchases.ts        # purchases + user_progress [HIDDEN]
│   ├── webinars.ts         # webinars + sessions + registrations [HIDDEN]
│   ├── gifts.ts            # [HIDDEN]
│   ├── reviews.ts          # [HIDDEN]
│   ├── cms.ts              # CMS content (JSONB)
│   ├── relations.ts        # All cross-table relations
│   └── index.ts            # Barrel export
├── drizzle/                # Generated migrations (committed to git)
│   ├── 0000_initial.sql
│   ├── 0001_add_xyz.sql
│   └── meta/               # Drizzle Kit metadata
└── drizzle.config.ts       # Drizzle Kit config
```

### Reglas de migraciones

1. **Schema as code es la fuente de verdad** — nunca editar SQL a mano
2. **Siempre revisar el SQL generado** antes de aplicar
3. **Commitear migraciones** al repo — son parte del código
4. **Una migración por cambio lógico** — no mezclar features
5. **Nunca borrar migraciones** ya aplicadas en producción
6. **Para migraciones destructivas** (DROP, ALTER TYPE) — crear script de rollback

### Conexión por entorno

| Entorno | Puerto | Modo | Uso |
|---------|--------|------|-----|
| Dev (migraciones) | 5432 | Session | DDL: CREATE, ALTER, DROP |
| Dev (app runtime) | 6543 | Transaction | DML: SELECT, INSERT, UPDATE |
| Producción | 5432 | Session | Solo para migraciones |
| Producción | 6543 | Transaction | App runtime |

**Importante**: El pooler de Supabase en port 6543 (transaction mode) NO soporta DDL. Las migraciones siempre van por port 5432 (session mode).

## CMS en PostgreSQL

### Tabla `cms_content`

El CMS usa JSONB para almacenar contenido semi-estructurado editable por el admin:

```sql
CREATE TABLE cms_content (
  id TEXT PRIMARY KEY DEFAULT 'main_page',
  content JSONB NOT NULL,
  version INT DEFAULT 1,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Estructura del JSONB

```json
{
  "hero": { "pl": { "title": "...", "subtitle": "..." }, "en": { ... } },
  "about": { "pl": { "story": { "paragraph1": "..." } }, "en": { ... } },
  "footer": { "pl": { ... }, "en": { ... } }
}
```

### Cache (sin Varnish)

| Capa | TTL | Propósito |
|------|-----|-----------|
| localStorage (frontend) | 24h | Respuesta inmediata, SWR |
| Cloudflare CDN | 30min (s-maxage) | Evita llegar al servidor |
| In-memory backend | 10min | Evita llegar a PostgreSQL |
| PostgreSQL JSONB | ∞ | Source of truth |

Invalidación: admin edita → purge in-memory → Cloudflare API purge → frontend revalida.
