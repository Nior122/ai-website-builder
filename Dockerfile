# =============================================================================
# Multi-stage Dockerfile — AI Website Builder Studio
# =============================================================================
# Stage 1: Install dependencies + generate Prisma client
# Stage 2: Build Next.js production bundle
# Stage 3: Minimal production image with only what's needed to run
# =============================================================================

# ─── Stage 1: Dependencies ───────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Install libc6-compat for Alpine Linux (needed by some native modules)
RUN apk add --no-cache libc6-compat

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# ─── Stage 2: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install libc6-compat for Alpine
RUN apk add --no-cache libc6-compat

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
