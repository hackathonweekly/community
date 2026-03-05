# ========================================
# Multi-stage build for Next.js standalone deployment (pnpm + turbo prune)
# ========================================

FROM node:22-slim AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# ========================================
# Pruner stage (keep only web + deps)
# ========================================
FROM base AS pruner
WORKDIR /app

COPY . .
RUN pnpm dlx turbo@2.5.0 prune --scope=web --docker

# ========================================
# Builder stage
# ========================================
FROM base AS builder
WORKDIR /app

# Prisma generate needs OpenSSL and the schema file during install
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy pruned manifests and lockfile
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Ensure Prisma schema exists before postinstall runs
COPY --from=pruner /app/out/full/packages/lib-server/src/database/prisma ./packages/lib-server/src/database/prisma

# Install deps for the pruned workspace
RUN pnpm install --frozen-lockfile

# Copy pruned source
COPY --from=pruner /app/out/full/ ./

# Build-time environment variables
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUCKET_NAME
ARG NEXT_PUBLIC_S3_ENDPOINT
ARG BUILD_VERSION=development
ARG BUILD_TIME=unknown
ARG GIT_COMMIT=unknown

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_BUCKET_NAME=${NEXT_PUBLIC_BUCKET_NAME}
ENV NEXT_PUBLIC_S3_ENDPOINT=${NEXT_PUBLIC_S3_ENDPOINT}
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_TIME=${BUILD_TIME}
ENV GIT_COMMIT=${GIT_COMMIT}

# Hard fail early if required public endpoints are missing
RUN : "${NEXT_PUBLIC_SITE_URL:?NEXT_PUBLIC_SITE_URL is required}" \
 && : "${NEXT_PUBLIC_BUCKET_NAME:?NEXT_PUBLIC_BUCKET_NAME is required}" \
 && : "${NEXT_PUBLIC_S3_ENDPOINT:?NEXT_PUBLIC_S3_ENDPOINT is required}"

# Build application
# BETTER_AUTH_SECRET is required by the auth library at import time but is only
# meaningful at runtime (session signing). Provide a dummy value so the build
# can proceed; the real secret is injected via environment variables at runtime.
RUN --mount=type=cache,target=/app/apps/web/.next/cache \
    NODE_OPTIONS="--max-old-space-size=8192" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BETTER_AUTH_SECRET="build-placeholder-secret-replaced-at-runtime" \
    pnpm run build

# ========================================
# Runner stage
# ========================================
FROM node:22-slim AS runner
WORKDIR /app

ARG BUILD_VERSION=development
ARG BUILD_TIME=unknown
ARG GIT_COMMIT=unknown
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUCKET_NAME
ARG NEXT_PUBLIC_S3_ENDPOINT

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    TZ=Asia/Shanghai \
    BUILD_VERSION=${BUILD_VERSION} \
    BUILD_TIME=${BUILD_TIME} \
    GIT_COMMIT=${GIT_COMMIT} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_BUCKET_NAME=${NEXT_PUBLIC_BUCKET_NAME} \
    NEXT_PUBLIC_S3_ENDPOINT=${NEXT_PUBLIC_S3_ENDPOINT}

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y openssl wget tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 88 nodejs && \
    useradd --system --uid 88 --gid nodejs nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/lib-server/src/database/prisma ./packages/lib-server/src/database/prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
