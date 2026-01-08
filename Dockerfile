# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time arguments for NEXT_PUBLIC_ variables
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_PIMLICO_API_KEY
ARG NEXT_PUBLIC_BLOCKCHAIN_MODE=mock

# Set as environment variables for build
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_PIMLICO_API_KEY=$NEXT_PUBLIC_PIMLICO_API_KEY
ENV NEXT_PUBLIC_BLOCKCHAIN_MODE=$NEXT_PUBLIC_BLOCKCHAIN_MODE

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install system dependencies first (least frequently changed)
RUN apk add --no-cache openssl

# Install global tools
RUN npm install -g prisma@6

# Create non-root user (before file operations for proper ownership)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/package.json ./package.json

# Copy startup script (avoid BuildKit-only COPY --chmod for compatibility)
COPY --from=builder /app/start.sh ./start.sh
RUN chmod 755 ./start.sh

# Create logs directory with proper ownership and permissions
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app/logs && \
    chmod 755 /app/logs

# Set non-root user for security (before CMD)
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./start.sh"]
