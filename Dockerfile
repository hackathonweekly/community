# ========================================
# Multi-stage build for Next.js standalone deployment
# Using official Bun image for faster builds
# ========================================

FROM oven/bun:1 AS base
WORKDIR /app

# ========================================
# Dependencies stage: Install dependencies only
# ========================================
FROM base AS deps

# Copy dependency files
COPY package.json bun.lockb ./
COPY src/lib/database/prisma ./src/lib/database/prisma

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Generate Prisma client
RUN bun x prisma generate --no-hints --schema=./src/lib/database/prisma/schema.prisma

# ========================================
# Builder stage: Build application
# ========================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/lib/database/prisma ./src/lib/database/prisma

# Copy source code
COPY . .

# Build-time environment variables (public configuration)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUCKET_NAME
ARG NEXT_PUBLIC_S3_ENDPOINT

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_BUCKET_NAME=${NEXT_PUBLIC_BUCKET_NAME}
ENV NEXT_PUBLIC_S3_ENDPOINT=${NEXT_PUBLIC_S3_ENDPOINT}

# Build the application using Bun
RUN --mount=type=cache,target=/app/.next/cache \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    bun run build

# ========================================
# Runner stage: Production runtime
# ========================================
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-privileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/database/prisma ./src/lib/database/prisma

# Create .next directory with correct permissions
RUN mkdir -p .next && chown nextjs:nodejs .next

USER nextjs

EXPOSE 3000

# Simplified health check using wget (available in alpine-based images)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application (Next.js standalone mode uses node)
CMD ["node", "server.js"]