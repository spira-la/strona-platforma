---
1. Backend .env — DEV (apidev.spira-la.com)

# ─── Server ───────────────────────────────────────────────────────────
PORT=3000

# ─── Database (PostgreSQL en server dev) ──────────────────────────────
DATABASE_HOST=46.224.100.39
DATABASE_PORT=45432
DATABASE_USER=spirala_dev
DATABASE_PASSWORD=<el que ya tienes>
DATABASE_NAME=spirala_dev
DATABASE_SCHEMA=spirala_dev_schema
# DATABASE_SSL=true               # solo si usas Supabase external u otro

# ─── Supabase Auth ────────────────────────────────────────────────────
SUPABASE_URL=https://fofdpgtpwibccezrnxnw.supabase.co
SUPABASE_ANON_KEY=<el que ya tienes>
SUPABASE_SERVICE_ROLE_KEY=<service role>

# ─── Cloudflare R2 (storage para imagenes + grabaciones MP4) ──────────
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<R2 token>
R2_SECRET_ACCESS_KEY=<R2 secret>
R2_BUCKET=spirala-storage-dev
R2_PUBLIC_URL=https://cdn-dev.spira-la.com

# ─── SMTP (Zoho — el que ya tienes funcionando) ───────────────────────
SMTP_HOST=smtppro.zoho.eu
SMTP_PORT=465
SMTP_USER=admin@spira-la.com
SMTP_PASS=<actual>
SMTP_FROM_EMAIL=no-reply@spira-la.com
SMTP_FROM_NAME=Spirala (Dev)

# ─── Stripe ───────────────────────────────────────────────────────────
# Mientras no esté el webhook creado en Stripe Dashboard:
STRIPE_MOCK_MODE=true
# Cuando crees el webhook, quitar la línea de arriba y completar:
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx     # del endpoint que crees apuntando a apidev.spira-la.com/api/stripe/webhook

# ─── LiveKit (apunta al server dev streamdev.spira-la.com) ────────────
LIVEKIT_API_KEY=SpiralaDevKey
LIVEKIT_API_SECRET=<openssl rand -base64 32>
LIVEKIT_HTTP_URL=https://streamdev.spira-la.com
LIVEKIT_PUBLIC_WS_URL=wss://streamdev.spira-la.com

# ─── Recording (graba sesiones 1-on-1, sube MP4 a R2) ─────────────────
RECORDING_TEMPLATE_URL=https://dev.spira-la.com/recording-template
RECORDING_API_KEY=<openssl rand -base64 32>
RECORDING_INTERNAL_API_URL=http://spirala-be-dev:3000
HLS_OUTPUT_PATH=/hls
HLS_BASE_URL=https://streamdev.spira-la.com/hls

# ─── Frontend URL (para .ics email + meeting links) ───────────────────
FRONTEND_URL=https://dev.spira-la.com

# ─── Cloudflare cache purge (opcional) ────────────────────────────────
CLOUDFLARE_ZONE_ID=bb19d3d62609f4ba4d8ae1519f6fddf4
CLOUDFLARE_API_TOKEN=<actual>
SITE_URL=https://dev.spira-la.com

# ─── Ollama (traducción AI — ya configurado en docker network) ────────
OLLAMA_URL=http://spirala-ollama:11434

2. Backend .env — PROD (api.spira-la.com)

# Mismas variables que dev, cambian solo los valores:

PORT=3000

DATABASE_HOST=46.224.100.39
DATABASE_PORT=45432
DATABASE_USER=spirala
DATABASE_PASSWORD=<prod>
DATABASE_NAME=spirala_prod
DATABASE_SCHEMA=spirala_schema

SUPABASE_URL=https://fofdpgtpwibccezrnxnw.supabase.co
SUPABASE_ANON_KEY=<prod o el mismo si compartes proyecto>
SUPABASE_SERVICE_ROLE_KEY=<prod>

R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<prod token>
R2_SECRET_ACCESS_KEY=<prod secret>
R2_BUCKET=spirala-storage
R2_PUBLIC_URL=https://cdn.spira-la.com

SMTP_HOST=smtppro.zoho.eu
SMTP_PORT=465
SMTP_USER=admin@spira-la.com
SMTP_PASS=<actual>
SMTP_FROM_EMAIL=no-reply@spira-la.com
SMTP_FROM_NAME=Spirala

# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx     # endpoint apuntando a api.spira-la.com/api/stripe/webhook
# NO poner STRIPE_MOCK_MODE en prod

# LiveKit prod
LIVEKIT_API_KEY=SpiralaProdKey
LIVEKIT_API_SECRET=<openssl rand -base64 32, distinto al dev>
LIVEKIT_HTTP_URL=https://stream.spira-la.com
LIVEKIT_PUBLIC_WS_URL=wss://stream.spira-la.com

RECORDING_TEMPLATE_URL=https://spira-la.com/recording-template
RECORDING_API_KEY=<openssl rand -base64 32, distinto al dev>
RECORDING_INTERNAL_API_URL=http://spirala-be:3000
HLS_OUTPUT_PATH=/hls
HLS_BASE_URL=https://stream.spira-la.com/hls

FRONTEND_URL=https://spira-la.com

CLOUDFLARE_ZONE_ID=<igual o distinto>
CLOUDFLARE_API_TOKEN=<prod>
SITE_URL=https://spira-la.com

OLLAMA_URL=http://spirala-ollama:11434

3. Frontend .env.local — DEV (build de dev.spira-la.com)

VITE_API_BASE_URL=https://apidev.spira-la.com
VITE_SUPABASE_URL=https://fofdpgtpwibccezrnxnw.supabase.co
VITE_SUPABASE_ANON_KEY=<el mismo que tiene tu backend>
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx

(BWM tenía además VITE_FIREBASE_* y VITE_RECORDING_API_KEY — Spirala no los necesita: Firebase está fuera, y la recording API key vive solo en backend porque el frontend Spirala no construye URLs de
template, lo hace el backend.)

4. Frontend .env.production — PROD (build de spira-la.com)

VITE_API_BASE_URL=https://api.spira-la.com
VITE_SUPABASE_URL=https://fofdpgtpwibccezrnxnw.supabase.co
VITE_SUPABASE_ANON_KEY=<prod o mismo>
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx

5. .env.livekit — raíz del repo (para docker-compose.livekit.yml)

# DEV
LIVEKIT_DEV_KEYS=SpiralaDevKey: <secret-32-chars>
LIVEKIT_API_KEY_DEV=SpiralaDevKey
LIVEKIT_API_SECRET_DEV=<mismo secret de arriba>

# PROD
LIVEKIT_PROD_KEYS=SpiralaProdKey: <secret-distinto-32-chars>
LIVEKIT_API_KEY_PROD=SpiralaProdKey
LIVEKIT_API_SECRET_PROD=<mismo secret de arriba>

⚠️ Crítico: LIVEKIT_API_KEY / LIVEKIT_API_SECRET del backend/.env deben coincidir con el par del LIVEKIT_*_KEYS del .env.livekit. Si no, el backend genera tokens que el server LiveKit rechaza.

---
Diferencias clave con BWM

┌─────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────┐
│                             BWM                             │                                      Spirala                                       │                      Por qué                       │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ STRIPE_MODE=test|live + STRIPE_SECRET_KEY_TEST +            │ STRIPE_SECRET_KEY (uno solo, dev usa sk_test_*, prod usa sk_live_*) +              │ Más simple; un servidor = una key                  │
│ STRIPE_SECRET_KEY                                           │ STRIPE_MOCK_MODE opcional                                                          │                                                    │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ GCLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS              │ R2_* + SUPABASE_*                                                                  │ Zero Firebase                                      │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ VITE_FIREBASE_* (7 vars)                                    │ VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY                                          │ Auth via Supabase                                  │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ VITE_USE_FIREBASE_EMULATORS                                 │ (no aplica)                                                                        │ —                                                  │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ VITE_CLARITY_ID                                             │ (opcional, no incluí — añadir si quieres MS Clarity)                               │ —                                                  │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ VITE_RECORDING_API_KEY                                      │ (no aplica)                                                                        │ Solo backend la usa                                │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ HOOK_SLACK                                                  │ (opcional, no incluí)                                                              │ Notificación de nuevas órdenes a Slack — añadir si │
│                                                             │                                                                                    │  quieres                                           │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ RECORDING_INTERNAL_API_URL                                  │ ✅ añadido                                                                         │ Chrome de egress no resuelve DNS público           │
└─────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────┘

Lo que tienes que generar tú (random secrets)

# Genera 4 secrets distintos:
openssl rand -base64 32   # LIVEKIT_API_SECRET dev
openssl rand -base64 32   # LIVEKIT_API_SECRET prod
openssl rand -base64 32   # RECORDING_API_KEY dev
openssl rand -base64 32   # RECORDING_API_KEY prod

Lo que tienes que crear externamente

┌─────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────┐
│        Servicio         │                                                   Acción                                                    │                Resultado                │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Stripe Dashboard (test) │ Webhooks → Add endpoint apuntando a apidev.spira-la.com/api/stripe/webhook, evento payment_intent.succeeded │ whsec_* para STRIPE_WEBHOOK_SECRET dev  │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Stripe Dashboard (live) │ Mismo, apuntando a api.spira-la.com/api/stripe/webhook                                                      │ whsec_* para STRIPE_WEBHOOK_SECRET prod │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Cloudflare DNS          │ A records: streamdev → server IP (DNS-only / gris) ; stream → server IP (DNS-only)                          │ LiveKit accesible                       │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Cloudflare R2           │ Crear buckets spirala-storage-dev y spirala-storage + API tokens con write                                  │ Credenciales R2_*                       │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Server                  │ certbot --nginx -d streamdev.spira-la.com y -d stream.spira-la.com                                          │ Certs SSL                               │
├─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Server firewall         │ UDP 43021, 43022, 7881-7920, 7882 abiertos                                                                  │ WebRTC media                            │
└─────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────┘

¿Quieres que te genere también un script setup-server.sh que tome estos envs y arranque toda la infra (db + livekit + nginx host) en orden?
