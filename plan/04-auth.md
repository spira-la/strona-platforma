# Auth - Firebase Auth → Supabase Auth

## Cambios

| Aspecto | Antes (Firebase) | Después (Supabase) |
|---------|-------------------|---------------------|
| SDK Frontend | `firebase/auth` | `@supabase/supabase-js` |
| SDK Backend | `firebase-admin` | `@supabase/supabase-js` (server) |
| Token | Firebase ID Token | Supabase JWT |
| Providers | Email, Google | Email, Google (mismos) |
| Session | Firebase manages | Supabase manages (cookies/localStorage) |
| Custom claims | Firebase custom claims | Supabase `profiles.role` + RLS |

## Frontend

### Reemplazar firebase auth hooks

```typescript
// Antes (Firebase)
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Después (Supabase)
import { supabase } from '@/lib/supabase';
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

### Auth store (Zustand) - adaptar

El store de auth existente se mantiene, solo cambia la implementación interna:
- `useAuthStore` sigue exponiendo `user`, `isAuthenticated`, `login`, `logout`, `register`
- Internamente usa Supabase en vez de Firebase

### Lazy loading

Mantener el patrón de lazy init que ya existe - Supabase client se inicializa en idle time.

## Backend (NestJS)

### Guard de auth

```typescript
// Antes: FirebaseAuthGuard verifica Firebase ID token
// Después: SupabaseAuthGuard verifica Supabase JWT

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;
    
    request.user = user;
    return true;
  }
}
```

### Roles

- `user` - usuario normal (compra sesiones, reserva)
- `admin` - la coach principal (gestiona todo)
- `coach` - se mantiene para futuro multi-coach

Los roles se guardan en `profiles.role` y se verifican via RLS o guards del backend.

## RLS Policies (reemplaza Firestore rules)

```sql
-- Los usuarios solo ven su propio perfil completo
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin ve todos los perfiles
CREATE POLICY "Admin reads all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Los usuarios solo ven sus propias órdenes
CREATE POLICY "Users read own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

-- Los usuarios solo ven sus propias reservas
CREATE POLICY "Users read own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Coach ve las reservas asignadas a ella
CREATE POLICY "Coach reads assigned bookings" ON bookings
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  );

-- Blog posts publicados son públicos
CREATE POLICY "Public reads published posts" ON blog_posts
  FOR SELECT USING (is_published = true);

-- Admin CRUD completo en blog
CREATE POLICY "Admin manages blog" ON blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

## Migración de usuarios existentes

Si hay usuarios de BeWonderMe que migrar:
1. Exportar usuarios de Firebase Auth (firebase-admin `listUsers`)
2. Importar a Supabase via API o SQL directo
3. Los passwords NO se pueden migrar directamente - opciones:
   a. Pedir reset de password a todos
   b. Usar Supabase hook que verifica contra Firebase como fallback temporal
