# ========================================
# Multi-stage build for Next.js standalone deployment
# Strategy: Bun for fast builds, Node for stable runtime
# ========================================

FROM node:22 AS base
WORKDIR /app

# Install Bun by copying from official image instead of curl
# This avoids network issues with curl to bun.sh
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# ========================================
# Dependencies stage: Install dependencies with Bun
# ========================================
FROM base AS deps

# Copy dependency files
COPY package.json bun.lockb ./
COPY src/lib/database/prisma ./src/lib/database/prisma

# Install dependencies with Bun (faster than npm)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Generate Prisma client
RUN bun x prisma generate --no-hints --schema=./src/lib/database/prisma/schema.prisma

# ========================================
# Builder stage: Build application with Bun
# ========================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/lib/database/prisma ./src/lib/database/prisma

# Copy source code
COPY . .

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

# Build application with Bun
RUN --mount=type=cache,target=/app/.next/cache \
    NODE_OPTIONS="--max-old-space-size=8192" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    bun run build

# ========================================
# Runner stage: Production runtime with Node.js
# ========================================
FROM node:22-slim AS runner
WORKDIR /app

ARG BUILD_VERSION=development
ARG BUILD_TIME=unknown
ARG GIT_COMMIT=unknown
# Public runtime envs are required by the built app to generate full URLs
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUCKET_NAME
ARG NEXT_PUBLIC_S3_ENDPOINT

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    BUILD_VERSION=${BUILD_VERSION} \
    BUILD_TIME=${BUILD_TIME} \
    GIT_COMMIT=${GIT_COMMIT} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_BUCKET_NAME=${NEXT_PUBLIC_BUCKET_NAME} \
    NEXT_PUBLIC_S3_ENDPOINT=${NEXT_PUBLIC_S3_ENDPOINT}

# Install OpenSSL for Prisma and wget for health check
RUN apt-get update && \
    apt-get install -y openssl wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-privileged user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/database/prisma ./src/lib/database/prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
