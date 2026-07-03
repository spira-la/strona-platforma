# Feature Flags System

## Concepto

Un sistema de feature flags que controle qué funcionalidades están visibles/activas. Esto permite:
- Ocultar features que no se usan ahora (webinars, marketplace, etc.)
- Reactivarlas con un cambio de config cuando se necesiten
- No tener que eliminar ni reescribir código

## Implementación propuesta

### Config centralizada (backend + frontend)

```typescript
// shared/feature-flags.ts
export interface FeatureFlags {
  // Marketplace & Multi-coach
  multiCoach: boolean;           // Múltiples coaches (perfiles, listado)
  coachPanel: boolean;           // Panel de coach independiente
  stripeConnect: boolean;        // Payouts a coaches via Stripe Connect
  
  // Content / Digital Products
  audioCourses: boolean;         // Cursos de audio
  ebooks: boolean;               // Ebooks / EPUB reader
  youtubeContent: boolean;       // Integración YouTube
  bundles: boolean;              // Bundles de productos
  
  // Live features
  webinars: boolean;             // Webinars / LiveKit streaming
  liveCoaching: boolean;         // Video calls via LiveKit
  
  // E-commerce extras
  giftPurchases: boolean;        // Compras de regalo
  multiCurrency: boolean;        // Múltiples monedas (solo PLN por ahora)
  reviews: boolean;              // Reviews de productos
  
  // Content
  blog: boolean;                 // Sistema de blog
  newsletter: boolean;           // Newsletter subscriptions
  
  // Admin
  fullAdminPanel: boolean;       // Admin panel completo vs simplificado
  cmsAdvanced: boolean;          // CMS avanzado
  seoManagement: boolean;        // Gestión SEO admin
  
  // Booking
  booking: boolean;              // Sistema de reservas
  packages: boolean;             // Paquetes de sesiones
}

// Configuración para Spirala (launch)
export const SPIRALA_DEFAULT_FLAGS: FeatureFlags = {
  // OFF - oculto pero disponible
  multiCoach: false,
  coachPanel: false,
  stripeConnect: false,
  audioCourses: false,
  ebooks: false,
  youtubeContent: false,
  bundles: false,
  webinars: false,
  liveCoaching: false,
  giftPurchases: false,
  multiCurrency: false,
  reviews: false,
  fullAdminPanel: false,
  cmsAdvanced: false,
  
  // ON - activo en Spirala
  blog: true,
  newsletter: true,
  booking: true,
  packages: true,
  seoManagement: true,
};
```

### Frontend - Uso en componentes

```tsx
// hooks/useFeatureFlag.ts
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useFeatureFlagsStore(state => state.flags);
  return flags[flag];
}

// En rutas (App.tsx)
{featureFlags.webinars && <Route path="/webinars" element={<Webinars />} />}
{featureFlags.audioCourses && <Route path="/cursos/:slug" element={<AudioCourse />} />}

// En navegación
{featureFlags.blog && <NavLink to="/blog">Blog</NavLink>}
```

### Backend - Guards con feature flags

```typescript
// common/guards/feature-flag.guard.ts
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredFlag = this.reflector.get<string>('featureFlag', context.getHandler());
    return this.featureFlagService.isEnabled(requiredFlag);
  }
}

// Uso en controllers
@UseGuards(FeatureFlagGuard)
@FeatureFlag('webinars')
@Controller('api/webinars')
export class WebinarsController { ... }
```

### Storage de flags

Para el MVP: archivo de config / env vars.
Futuro: tabla en PostgreSQL para poder cambiarlos desde admin panel sin redeploy.

```sql
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Flags iniciales para Spirala

| Feature | Estado | Razón |
|---------|--------|-------|
| booking | ON | Core del negocio |
| packages | ON | Paquetes de sesiones |
| blog | ON | Marketing/contenido |
| newsletter | ON | Email marketing |
| seoManagement | ON | SEO para el blog |
| multiCoach | OFF | Solo una coach por ahora |
| webinars | OFF | No se usa aún |
| audioCourses | OFF | No se usa aún |
| ebooks | OFF | No se usa aún |
| giftPurchases | OFF | No se usa aún |
| Todo lo demás | OFF | Reactivable cuando se necesite |
