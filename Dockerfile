# Multi-stage build for optimal image size
FROM node:20-alpine AS deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# DÜZELTME BURADA: --omit=dev parametresini kaldırdık.
# Build alabilmek için devDependencies (prisma, typescript vb.) gereklidir.
RUN npm ci --legacy-peer-deps || \
    npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
# Artık yerel prisma versiyonunu (6.1.0) kullanacak
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies
RUN apk add --no-cache curl wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/.next /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# EKLENEN KISIM: sharp'ı linux-musl (Alpine) için spesifik olarak ekle
RUN npm install --omit=dev && \
    npm install sharp

# EKLENEN KISIM: Eksik production paketlerini yükle (bcryptjs vb.)
RUN npm install --omit=dev

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files - Bu kısım doğruydu, aynen kalıyor
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# ----------------- KRİTİK DÜZELTME BAŞLANGICI -----------------
# Uploads klasörünü oluştur ve izinleri nextjs kullanıcısına ver.
# Bu, volume mount edilse bile sahipliğin doğru başlamasına yardımcı olur.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public
# ----------------- KRİTİK DÜZELTME BİTİŞİ ---------------------

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Bu satırı ekleyerek imajın kendisini güvenli hale getiriyoruz:
ENV AUTH_TRUST_HOST=true

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
