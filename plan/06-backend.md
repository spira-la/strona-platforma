# Backend - Adaptaciones NestJS

## Enfoque

El backend de NestJS se copia de BeWonderMe y se adapta. Los módulos no usados se mantienen pero se protegen con feature flag guards. Los módulos activos se adaptan para usar Supabase/PostgreSQL en vez de Firebase.

## Cambios core

### 1. Firestore → PostgreSQL (Drizzle ORM)

```typescript
// Antes: firestore.service.ts
this.firestore.collection('bookings').where('userId', '==', userId).get();

// Después: con Drizzle ORM
await db.select().from(bookings).where(eq(bookings.userId, userId));
```

Cada módulo que usa `FirestoreService` se migra a usar Drizzle queries.

### 2. Firebase Admin → Supabase Server

```typescript
// Antes: firebase.config.ts
import * as admin from 'firebase-admin';

// Después: supabase.config.ts  
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

### 3. CollectionHelperService → ELIMINAR

El patrón de `_test` suffix desaparece. Cada entorno (dev/staging/prod) tiene su propia instancia de Supabase.

### 4. Auth Guard

```typescript
// firebase-auth.guard.ts → supabase-auth.guard.ts
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    request.user = user;
    return !!user;
  }
}
```

### 5. Feature Flag Guard (NUEVO)

```typescript
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.get<string>('featureFlag', context.getHandler()) 
      || this.reflector.get<string>('featureFlag', context.getClass());
    if (!flag) return true;
    return this.featureFlagService.isEnabled(flag);
  }
}
```

### 6. Storage → Cloudflare R2

Firebase Storage → Cloudflare R2 (S3-compatible API). Ver [10-storage-cloudflare-r2.md](10-storage-cloudflare-r2.md) para detalles completos.

```typescript
// Antes (Firebase)
const bucket = admin.storage().bucket();
await bucket.upload(file);

// Después (R2 via AWS S3 SDK)
await this.s3.send(new PutObjectCommand({
  Bucket: this.bucket,
  Key: path,
  Body: file,
  ContentType: contentType,
}));
```

Dependencias que se eliminan: `@google-cloud/storage`, `firebase/storage`
Dependencias que se agregan: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

## Módulos - Estado

### Activos (se migran completamente a PostgreSQL)

| Módulo | Cambios |
|--------|---------|
| `stripe/` | Nueva cuenta Stripe, misma lógica |
| `bookings/` | Queries → Drizzle, FK a orders/coaches |
| `email/` | Sin cambios (Nodemailer se mantiene, considerar Resend) |
| `invoice/` | Queries → Drizzle |
| `blogs/` | Queries → Drizzle |
| `newsletter/` | Queries → Drizzle |
| `images/` | Storage → Cloudflare R2 |
| `coupons/` | Queries → Drizzle |
| `health/` | Sin cambios |
| `admin/` | Simplificado + feature flags |

### Ocultos con Feature Flag Guard (código se mantiene, se adaptan queries)

| Módulo | Flag |
|--------|------|
| `livekit/` | `webinars` |
| `webinar-live/` | `webinars` |
| `webinars/` | `webinars` |
| `webinar-sessions/` | `webinars` |
| `webinar-registrations/` | `webinars` |
| `scene-templates/` | `webinars` |
| `stripe-connect/` | `stripeConnect` |
| `coaches/` (multi) | `multiCoach` |
| `coaching-services/` (multi) | `multiCoach` |
| `products/` | `audioCourses` / `ebooks` |
| `purchases/` | `audioCourses` / `ebooks` |
| `progress/` | `audioCourses` / `ebooks` |
| `youtube/` | `youtubeContent` |
| `gifts/` | `giftPurchases` |
| `reviews/` | `reviews` |

## Renaming

Todo lo que diga `bewonderme` o `be-wonder` se renombra a `spirala` o `spira-la`:
- Package names
- Docker image names
- Environment variables prefixes
- Email from addresses
- API base URLs
- Config references
