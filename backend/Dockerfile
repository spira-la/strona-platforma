# =====================================================================
# Spirala Backend — Multi-stage Dockerfile (NestJS)
# Uses BuildKit cache mounts: ~3-5x faster rebuilds
# =====================================================================
# syntax=docker/dockerfile:1.6

# ---------------------------------------------------------------------
# Stage 1: deps — install all dependencies (including devDeps for build)
# ---------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

# ---------------------------------------------------------------------
# Stage 2: builder — compile TypeScript
# ---------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# CACHEBUST is set by the deploy workflow to the current git SHA so the
# COPY layer above (and everything below it) is guaranteed to re-run when
# source files change — even if BuildKit thinks the cache is fresh.
ARG CACHEBUST=unset
RUN echo "build sha: $CACHEBUST"

RUN npm run build

# ---------------------------------------------------------------------
# Stage 3: prod-deps — production-only dependencies
# ---------------------------------------------------------------------
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev

# ---------------------------------------------------------------------
# Stage 4: runner — lean production image
# ---------------------------------------------------------------------
FROM node:22-alpine AS runner

# dumb-init for proper signal handling.
# ffmpeg is required by LivekitEgressService.concatenateHlsSegments()
# to remux .ts segments into MP4 with `ffmpeg -c copy`. Without it the
# coach's "stop recording" call fails when generating the final MP4.
RUN apk add --no-cache dumb-init ffmpeg

# Create non-root user
RUN addgroup -g 1001 -S nestjs && \
    adduser -u 1001 -S nestjs -G nestjs

WORKDIR /app

# Copy compiled output and production node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=prod-deps --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --chown=nestjs:nestjs package*.json ./

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["dumb-init", "node", "dist/main"]
