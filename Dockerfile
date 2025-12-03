# Multi-stage build for optimal image size
FROM node:20-alpine AS deps

# Install dependencies
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (Prisma here comes from package.json dependencies)
RUN npm ci --legacy-peer-deps || \
    npm install --legacy-peer-deps

# Rebuild the source code
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ----------------- GÜNCELLEME -----------------
# libc6-compat: Prisma motorunun doğru çalışması için kritik
RUN apk add --no-cache curl wget netcat-openbsd ca-certificates openssl libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/.next /app/public/uploads

# Copy package files
COPY --from=builder /app/package.json ./package.json

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps && \
    npm install --platform=linux --arch=x64 sharp

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy start script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

# Permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV AUTH_TRUST_HOST=true

# Entrypoint
CMD ["./start.sh"]