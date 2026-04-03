# Spirala - Plan de Migración

## Resumen

Migración de **BeWonderMe** → **Spirala** (spira-la como dominio, Spirala como marca).

**Enfoque principal:** Reskin con nuevo diseño + mejora de estructura de DB (Firebase → Supabase/PostgreSQL) + ocultamiento de features no usadas via feature flags. NO es una reescritura. Todo el código multi-coach/marketplace se mantiene para reactivar en el futuro.

**Zero Firebase:** Se elimina Firebase completamente (auth, db, storage, analytics). Storage va a Cloudflare R2 (dominio ya en Cloudflare, sin egress fees).

## Documentos del plan

1. [Estrategia General](01-estrategia-general.md) - Filosofía y decisiones clave
2. [Feature Flags](02-feature-flags.md) - Sistema de features ocultas/visibles
3. [Base de Datos](03-base-de-datos.md) - Migración Firebase → Supabase/PostgreSQL
4. [Auth](04-auth.md) - Firebase Auth → Supabase Auth
5. [Frontend - Diseño](05-frontend-diseno.md) - Nuevo diseño Spirala
6. [Backend](06-backend.md) - Adaptaciones NestJS
7. [Stripe](07-stripe.md) - Nueva cuenta Stripe
8. [Infraestructura](08-infraestructura.md) - CI/CD, deploy, DNS, zero Firebase
9. [Orden de Ejecución](09-orden-ejecucion.md) - Fases y prioridades
10. [Storage - Cloudflare R2](10-storage-cloudflare-r2.md) - Reemplazo de Firebase Storage

## Estado

- [ ] Fase 0: Setup proyecto
- [ ] Fase 1: Feature flags system
- [ ] Fase 2: Base de datos (Supabase/PostgreSQL)
- [ ] Fase 3: Auth (Supabase Auth)
- [ ] Fase 4: Stripe nueva cuenta
- [ ] Fase 5: Backend adaptaciones
- [ ] Fase 6: Frontend nuevo diseño
- [ ] Fase 7: Infraestructura y deploy
