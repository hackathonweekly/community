# Multi-stage build for Next.js standalone deployment
# Supports cross-platform builds (linux/amd64, linux/arm64)
FROM node:22 AS base

# Install bun globally in base stage (shared across all stages)
RUN npm install -g bun

# Build stage: install dependencies and build application
FROM base AS builder
# Note: Bun includes Node.js compatibility layer, no additional libc packages needed
WORKDIR /app

# Build-time environment variables (public configuration)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUCKET_NAME
ARG NEXT_PUBLIC_S3_ENDPOINT

# Set build-time environment variables
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_BUCKET_NAME=${NEXT_PUBLIC_BUCKET_NAME}
ENV NEXT_PUBLIC_S3_ENDPOINT=${NEXT_PUBLIC_S3_ENDPOINT}

# Copy package manager files first for better caching
COPY package.json bun.lockb ./
COPY src/lib/database/prisma ./src/lib/database/prisma

# Install dependencies using bun with cache mount for better performance
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate --no-hints --schema=./src/lib/database/prisma/schema.prisma

# Check available memory before build
RUN echo "=== Memory Information ===" && \
    cat /proc/meminfo | grep -E "(MemTotal|MemAvailable)" && \
    echo "=== Container Memory Limits ===" && \
    cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "No cgroup memory limit found" && \
    echo "=== System Info ===" && \
    uname -a && \
    echo "========================="

# Build the application with compile-only mode to skip static generation
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SKIP_TYPE_CHECK=true \
    NEXT_OUTPUT_MODE=server \
    npm run build -- --experimental-build-mode=compile

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder from the project as this is not included in the standalone build
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/database/prisma ./src/lib/database/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
# All environment variables should be passed at runtime via docker run -e or docker-compose
CMD ["node", "server.js"]