# Webinar Studio Migration Plan

The full BWM webinar studio code is preserved in `frontend/src/_archive/webinar-studio/` (97 files, ~15 000 LOC) and excluded from `tsconfig.app.json` so the build stays green while the feature flag is OFF. This document is the playbook for activating it without leaving technical debt.

## What's in `_archive/webinar-studio/`

| Folder | What it contains |
|---|---|
| `pages/` | `Webinars`, `WebinarRoom`, `WebinarDetail`, `WebinarReplay`, `WebinarRecordingTemplate`, `MyWebinars`, `WebinarStudio` (coach), `MeetingRoom`, `MeetingRecordingTemplate` |
| `components-webinar-full/` | 25 webinar components (chat, polls, Q&A, attendee list, HLS players, scene compositor, layouts, reactions, giveaway banners, control bars, side panel) |
| `components-webinar-full/scene-controls/` | Scene composition (overlays, camera slot styles, corner images, backgrounds) |
| `components-webinar-full/studio/` | Live studio UI: presentation share, host preview, viewer count, LiveKit media controller |
| `components-meeting/` | 5 1-on-1 meeting components (ControlBar, Grid, Header, ReactionButtons, ReactionOverlay) — these need scene sync from webinar studio |
| `hooks-meeting/` | `useMeetingReactions`, `useMeetingSession` |
| `hooks/studio/` | Studio-specific hooks (presentation slides, scene templates, etc.) |
| `hooks/webinar/` | Webinar-specific hooks |
| `clients/` | `WebinarsClient`, `WebinarSessionsClient`, `WebinarLiveClient`, `StudioAssetsClient`, plus BWM adapters (`BookingsClient`, `MeetingClient`, `CoachesClient`) |
| `contexts/ThemeContext.tsx` | Theme provider used by every studio component |
| `domain/products/` | Scene template models |

## Activation steps (when webinars feature flag flips ON)

### 1. Backend — port webinar modules to PostgreSQL/TypeORM
The DB entities already exist (`webinar.entity.ts`, `WebinarEntity`, `WebinarSessionEntity`, `WebinarRegistrationEntity`). The corresponding NestJS modules are scaffolded but empty:

```
backend/src/modules/webinars/         ← empty
backend/src/modules/webinar-sessions/ ← empty
backend/src/modules/webinar-registrations/ ← empty
```

Port the following from `ref/BeWonderMeFE/backend/src/modules/`:

| BWM module | Spirala target | Notes |
|---|---|---|
| `webinars/` | `backend/src/modules/webinars/` | CRUD on webinars; replace Firestore → TypeORM |
| `webinars/` (sessions sub-controller) | `backend/src/modules/webinar-sessions/` | session lifecycle (scheduled → live → completed) |
| `webinars/` (registrations) | `backend/src/modules/webinar-registrations/` | attendee signup; integrate with orders flow |
| `studio-assets/` (NEW) | `backend/src/modules/studio-assets/` | corner images, backgrounds, branding stored in R2; needed by `StudioAssetsClient` |

For each module:
- Replace `@google-cloud/firestore` queries with TypeORM repository methods (entities are ready).
- Replace `FirebaseStorage` uploads with `StorageService.upload()` (R2).
- Auth: replace `@FirebaseAuth()` decorator with `SupabaseAuthGuard` (already in `common/guards/`).
- Wire feature-flag guard `@FeatureFlag('webinars')` on every controller (already exists).

### 2. Frontend — restore from archive in passes

Pass 1 — flat-copy back without imports:
```bash
mv src/_archive/webinar-studio/contexts/ThemeContext.tsx src/contexts/
mv src/_archive/webinar-studio/components-ui/* src/components/ui/
mv src/_archive/webinar-studio/hooks/use-toast.ts src/hooks/
mv src/_archive/webinar-studio/hooks/useMediaPermissions.ts src/hooks/
mv src/_archive/webinar-studio/hooks/useMediaPreview.ts src/hooks/
mv src/_archive/webinar-studio/hooks/useWakeLock.ts src/hooks/
mv src/_archive/webinar-studio/clients/{Bookings,Meeting,Coaches}Client.ts src/clients/
mv src/_archive/webinar-studio/components-webinar-full src/components/webinar
mv src/_archive/webinar-studio/components-meeting src/components/meeting
mv src/_archive/webinar-studio/hooks-meeting src/hooks/meeting
mv src/_archive/webinar-studio/hooks/studio src/hooks/studio
mv src/_archive/webinar-studio/hooks/webinar src/hooks/webinar
mv src/_archive/webinar-studio/clients/{Webinars,WebinarSessions,WebinarLive,StudioAssets}Client.ts src/clients/
mv src/_archive/webinar-studio/domain src/domain
mv src/_archive/webinar-studio/pages/* src/pages/
```

Pass 2 — adapt imports per file (search/replace):
- `@/clients/BookingsClient` → keep (adapter shim already maps to `bookings.client`)
- `@/clients/MeetingClient` → keep (adapter shim already in place)
- `@/clients/CoachesClient` → keep (adapter shim already in place)
- `@/clients/WebinarsClient` → port endpoints in step 1
- Firebase imports → remove (Spirala has no Firebase)
- `currentUser.uid` → `user.id` (Supabase) — done in `useMeetingSession.ts` as reference
- `parseFirestoreDate(x)` → `new Date(x)` (already simplified in `utils/dateFormat.ts`)
- `@/contexts/AuthContext` → already exists, signature differs (Supabase user shape)

Pass 3 — wire routes in `App.tsx` behind `useFeatureFlag('webinars')`:
```tsx
{showWebinars && (
  <>
    <Route path="/webinary" element={<Webinars />} />
    <Route path="/webinary/:slug" element={<WebinarDetail />} />
    <Route path="/webinary/:slug/live" element={<WebinarRoom />} />
    <Route path="/webinary/:slug/replay" element={<WebinarReplay />} />
    <Route path="/moje-webinary" element={<MyWebinars />} />
    <Route path="/coach/webinar-studio/:sessionId" element={<WebinarStudio />} />
  </>
)}
```

Pass 4 — remove `tsconfig.app.json` exclude:
```diff
- "exclude": ["src/_archive/**"]
```

### 3. Infra ya lista (no acción)
- ✅ LiveKit + Egress containers en `docker-compose.livekit.yml`
- ✅ Host nginx para `streamdev.spira-la.com` y `stream.spira-la.com`
- ✅ HLS volumes y nginx-hls
- ✅ `recording-template/:bookingId` route (Spirala) ya graba 1-on-1
- ✅ `RECORDING_TEMPLATE_URL` configurable

### 4. UI styling (paso final)
Replace BWM tokens (`bwm-*`, `bg-bwm-section`, `text-bwm-primary`, etc.) with Spirala equivalents (`brand-*`, `bg-cream`, `text-text-primary`). Search-replace pass:

```bash
cd frontend/src
find components/webinar components/meeting hooks pages -type f \( -name '*.tsx' -o -name '*.ts' \) \
  -exec sed -i '' \
    -e 's/bg-bwm-section/bg-bg-cream/g' \
    -e 's/bg-bwm-card/bg-bg-white/g' \
    -e 's/bg-bwm-card-alt/bg-bg-warm/g' \
    -e 's/text-bwm-primary/text-text-primary/g' \
    -e 's/text-bwm-secondary/text-text-secondary/g' \
    -e 's/text-bwm-muted/text-text-muted/g' \
    -e 's/border-bwm-card/border-border-warm/g' \
    -e 's/border-bwm-border/border-border-warm/g' \
    -e 's/bwm-accent-light/brand-gold-light/g' \
    -e 's/bwm-accent-dark/brand-gold-dark/g' \
    -e 's/bwm-accent/brand-gold/g' \
    {} +
```

The temporary `bwm-*` tokens in `spirala-theme.css` can be removed after this pass.

## What's NOT in the archive (will need to migrate manually)

- `firestore.rules` → translated to Supabase RLS policies (already done for active features; add for `webinars`/`webinar_sessions`/`webinar_registrations` tables).
- BWM Cloud Functions (Firebase Functions) → already replaced project-wide by NestJS modules; webinar-specific functions live inside the modules above.
- StudioAssets storage paths: BWM used `gs://bwm-bucket/studio/<userId>/...`. Spirala will use `r2://spirala-storage/studio/<userId>/...`.

## Estimated effort

| Pass | Effort | Risk |
|---|---|---|
| Backend port (modules + controllers) | ~6 h | medium — Firestore→TypeORM mappings |
| Frontend restore + import adapters | ~3 h | low — adapter shims already exist |
| Wire routes + feature flag check | ~30 min | low |
| UI restyle (BWM tokens → Spirala) | ~2 h | low |
| Manual smoke test | ~1 h | depends on LiveKit infra readiness |
| **Total** | **~12 h** | |
