# =====================================================================
# Spirala Frontend — Multi-stage Dockerfile
# Uses BuildKit cache mounts: ~3-5x faster rebuilds
# =====================================================================
# syntax=docker/dockerfile:1.6

# ---------------------------------------------------------------------
# Stage 1: deps — install all dependencies
# ---------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY frontend/package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

# ---------------------------------------------------------------------
# Stage 2: builder — compile the Vite/React app
# ---------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------------------------------------------------------------------
# Stage 3: runner — production nginx image (dist baked in)
# ---------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Create non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -u 1001 -S nginx-app -G nginx-app && \
    # Allow nginx worker to run under root group (required for pid/cache)
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/docker-nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx-app:nginx-app /usr/share/nginx/html

USER nginx-app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------------------------------------------
# Stage 4: runner-prebuilt — nginx image expecting dist/ volume-mounted
# (used when the build happens on the server and dist/ is mounted at runtime)
# ---------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner-prebuilt

RUN addgroup -g 1001 -S nginx-app && \
    adduser -u 1001 -S nginx-app -G nginx-app && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

COPY nginx/docker-nginx.conf /etc/nginx/conf.d/default.conf

USER nginx-app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
