# Infraestructura

## Stack final (zero Firebase)

| Servicio | Antes (BeWonderMe) | Después (Spirala) |
|----------|---------------------|-------------------|
| Auth | Firebase Auth | Supabase Auth |
| Database | Firebase Firestore | Supabase PostgreSQL |
| Storage | Firebase Storage | Cloudflare R2 |
| Analytics | Firebase Analytics + Clarity | Cloudflare Analytics + Clarity |
| CDN | Ninguno dedicado | Cloudflare (ya incluido con dominio) |
| DNS | Cloudflare | Cloudflare (se mantiene) |
| Payments | Stripe | Stripe (nueva cuenta) |
| Backend | NestJS en Docker | NestJS en Docker (se mantiene) |
| Frontend | Vite SPA + Nginx | Vite SPA + Cloudflare Pages (o Nginx) |

### Firebase se elimina completamente
- `firebase` npm package → se elimina del frontend
- `firebase-admin` npm package → se elimina del backend
- `@google-cloud/storage` → se elimina (reemplazado por `@aws-sdk/client-s3`)
- `@google-cloud/firestore` → se elimina (reemplazado por Drizzle ORM)
- `@google-cloud/secret-manager` → evaluar (env vars o Cloudflare secrets)
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` → se eliminan
- Firebase emulators → Supabase local (`supabase start`)

## CI/CD

Se adaptan los GitHub Actions existentes de BeWonderMe:
- `deploy-prod.yml` → apunta a nuevo servidor/dominio
- `deploy-dev.yml` → apunta a dev environment
- Misma lógica de smart deployment (detect changes, parallel builds)

### Simplificaciones posibles

- **Redis**: Evaluar si sigue siendo necesario. Para un sitio de una coach, TanStack Query (frontend) + PostgreSQL connection pooling (Supabase) pueden ser suficientes. Si se reactivan webinars, se re-agrega.
- **Varnish**: Ya no es necesario. Cloudflare CDN maneja el caching. R2 sirve assets con CDN incluido.

## Docker

```yaml
# docker-compose.yml simplificado
services:
  backend:
    build: ./backend
    environment:
      - SUPABASE_URL=...
      - SUPABASE_SERVICE_KEY=...
      - STRIPE_SECRET_KEY=...
      - R2_ACCOUNT_ID=...
      - R2_ACCESS_KEY_ID=...
      - R2_SECRET_ACCESS_KEY=...
      - R2_BUCKET_NAME=spirala-media
      - R2_PUBLIC_URL=https://media.spira-la.com
    ports:
      - "3000:3000"
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
```

## Alternativa: Cloudflare Pages para frontend

Dado que todo está en Cloudflare, el frontend podría deployarse en **Cloudflare Pages** en vez de Nginx:
- Deploy automático desde GitHub
- CDN global gratuito
- Preview deployments por PR
- Custom domain fácil (ya está en Cloudflare)
- Sin necesidad de Nginx para el frontend

```yaml
# Si se usa Cloudflare Pages, docker-compose solo tiene backend
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
```

## DNS (Cloudflare)

- Dominio: `spira-la.com` (o el que sea, ya en Cloudflare)
- `spira-la.com` → Cloudflare Pages (frontend) o Nginx
- `api.spira-la.com` → Backend server
- `media.spira-la.com` → Cloudflare R2 bucket (custom domain)
- `dev.spira-la.com` → Dev environment

## Supabase

### Opción A: Supabase Cloud (recomendado para empezar)
- Free tier o Pro ($25/mo)
- Incluye: PostgreSQL, Auth, Realtime, Edge Functions
- Backups automáticos
- Dashboard de admin
- NO usamos Supabase Storage (usamos R2)

### Opción B: Self-hosted
- Más control, más mantenimiento
- docker-compose con servicios de Supabase

## Entornos

| Entorno | Supabase | Stripe | R2 Bucket | Dominio |
|---------|----------|--------|-----------|---------|
| Dev | Proyecto dev | Test keys | spirala-media-dev | localhost |
| Staging | Proyecto staging | Test keys | spirala-media-staging | staging.spira-la.com |
| Prod | Proyecto prod | Live keys | spirala-media | spira-la.com |

Sin más `_test` suffixes. Cada entorno es completamente independiente.

## Secrets

Opciones (en orden de preferencia dado el stack Cloudflare):
1. **Cloudflare secrets** (si backend va en Cloudflare Workers/Pages)
2. **Environment variables** en el servidor (si backend sigue en VM/Docker)
3. Supabase vault para secrets de DB
