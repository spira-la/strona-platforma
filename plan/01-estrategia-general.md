# Estrategia General

## Filosofía

**"Ocultar, no eliminar."** Todo el código existente de BeWonderMe que funciona (multi-coach, marketplace, webinars, audio/ebooks, gifts, etc.) se MANTIENE en el codebase. Se oculta mediante feature flags para que pueda reactivarse en el futuro sin reescribir nada.

## Qué SÍ cambia

1. **Diseño completo** - Nuevo diseño Spirala (dorado/tierra, naturaleza, elegante)
2. **Branding** - BeWonderMe → Spirala (spira-la como URL/dominio, Spirala como marca)
3. **Base de datos** - Firebase Firestore → Supabase PostgreSQL (relaciones reales con FKs)
4. **Auth** - Firebase Auth → Supabase Auth
5. **Storage** - Firebase Storage → Cloudflare R2 (dominio ya está en Cloudflare, sin egress fees)
6. **Stripe** - Nueva cuenta Stripe (nuevos productos, webhooks, keys)
7. **Firebase** - Se elimina completamente como dependencia (auth, db, storage, analytics)
8. **Features visibles** - Solo las que la coach principal usa ahora:
   - Landing page
   - Sobre mí / Cómo trabajo
   - Servicios (sesiones 1-a-1 y paquetes)
   - Booking (calendario + selección de hora)
   - Blog + Newsletter
   - Contacto
   - Confirmación de compra

## Qué NO cambia (se oculta pero se mantiene)

- Código de multi-coach/marketplace
- Webinars / LiveKit integration
- Audio courses / Ebook player
- YouTube integration
- Gift purchases
- Stripe Connect (coach payouts)
- Coach panel / Admin panel completo
- Reviews system
- CMS avanzado

## Qué SÍ se mejora aprovechando la migración

- Estructura de DB relacional (PostgreSQL) en vez de NoSQL con relaciones simuladas
- Eliminar el patrón `_test` suffix → entornos separados (staging/prod)
- Row Level Security (RLS) de Supabase en vez de 859 líneas de Firestore rules
- Feature flags como sistema formal, no código muerto
- Renaming completo: bewonderme → spirala en todo el codebase
- Eliminar Firebase completamente como dependencia (zero Firebase)
- Storage en Cloudflare R2 (sin egress fees, CDN integrado, dominio ya en Cloudflare)
