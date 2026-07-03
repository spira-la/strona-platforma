# Orden de Ejecución

## Fases

```
┌─────────────────────────────────────────────────────────┐
│  Fase 0: Setup                                          │
│  - Copiar BeWonderMeFE como base                        │
│  - Renaming bewonderme → spirala                        │
│  - Instalar dependencias                                │
│  - Setup Supabase project                               │
├─────────────────────────────────────────────────────────┤
│  Fase 1: Feature Flags                                  │
│  - Implementar sistema de feature flags                 │
│  - Configurar flags iniciales (ocultar lo no usado)     │
│  - Proteger rutas frontend y endpoints backend          │
├─────────────────────────────────────────────────────────┤
│  Fase 2: Base de datos                                  │
│  - Crear schema PostgreSQL en Supabase                  │
│  - Setup Drizzle ORM                                    │
│  - Migrar servicios backend de Firestore a Drizzle      │
│  - Setup RLS policies                                   │
├─────────────────────────────────────────────────────────┤
│  Fase 3: Auth                                           │
│  - Configurar Supabase Auth                             │
│  - Migrar frontend auth (stores, hooks)                 │
│  - Migrar backend guards                                │
│  - Migrar usuarios si hay datos                         │
├─────────────────────────────────────────────────────────┤
│  Fase 4: Stripe                                         │
│  - Crear cuenta Stripe nueva                            │
│  - Crear productos y precios                            │
│  - Configurar webhooks                                  │
│  - Actualizar keys en env                               │
├─────────────────────────────────────────────────────────┤
│  Fase 5: Backend adaptaciones                           │
│  - Migrar módulos activos a PostgreSQL                  │
│  - Feature flag guards en módulos ocultos               │
│  - Storage → Supabase Storage                           │
│  - Email templates renaming                             │
├─────────────────────────────────────────────────────────┤
│  Fase 6: Frontend - Nuevo diseño                        │
│  - Tailwind theme Spirala (colores, fonts)              │
│  - Navbar + Footer nuevos                               │
│  - Landing page                                         │
│  - O Mnie, Jak Pracuję (páginas estáticas)              │
│  - Usługi + Booking flow (calendario + hora)            │
│  - Blog rediseño                                        │
│  - Kontakt                                              │
│  - Potwierdzenie zakupu                                 │
│  - Mobile responsive                                    │
├─────────────────────────────────────────────────────────┤
│  Fase 7: Infraestructura                                │
│  - Adaptar CI/CD (GitHub Actions)                       │
│  - Docker configs                                       │
│  - DNS + SSL                                            │
│  - Deploy staging → producción                          │
└─────────────────────────────────────────────────────────┘
```

## Dependencias entre fases

```
Fase 0 (Setup)
  ↓
Fase 1 (Feature Flags) ──→ Fase 6 (Frontend) depende de flags
  ↓
Fase 2 (DB) + Fase 3 (Auth) ──→ pueden ir en paralelo
  ↓
Fase 4 (Stripe) ──→ necesita DB lista para guardar productos
  ↓
Fase 5 (Backend) ──→ necesita DB + Auth + Stripe
  ↓
Fase 6 (Frontend) ──→ necesita backend listo para integrar
  ↓
Fase 7 (Infra) ──→ al final cuando todo funcione
```

## Prioridad sugerida para empezar

1. **Fase 0 + 1** primero (setup + feature flags) - permite trabajar con el código inmediatamente
2. **Fase 6** en paralelo con Fase 2/3 - el diseño no depende tanto del backend, se puede mockear
3. **Fase 2 + 3** - DB y auth son el core
4. **Fase 4 + 5** - integración
5. **Fase 7** - deploy

## Estimación de complejidad

| Fase | Complejidad | Notas |
|------|-------------|-------|
| 0 - Setup | Baja | Copiar + renaming |
| 1 - Feature flags | Baja | Sistema simple de config |
| 2 - Base de datos | Alta | Migración de todos los queries |
| 3 - Auth | Media | Cambio de SDK + guards |
| 4 - Stripe | Baja | Solo cambiar keys + crear productos |
| 5 - Backend | Alta | Migrar queries módulo por módulo |
| 6 - Frontend diseño | Alta | 10 screens nuevos, responsive |
| 7 - Infra | Media | Adaptar lo existente |
