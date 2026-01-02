# Multi-stage build for optimal image size and security
# Stage 1: Dependencies - Install production dependencies only
FROM node:20-alpine AS deps

WORKDIR /app/backend

# Copy package files for dependency installation
COPY apps/backend/package.json ./

# Install production dependencies only (works with or without lock file)
RUN npm install --only=production --ignore-scripts --legacy-peer-deps

# Stage 2: Builder - Build TypeScript and generate Prisma Client
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY apps/backend/package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install --ignore-scripts --legacy-peer-deps

# Copy source code
COPY apps/backend ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Clean up unnecessary Prisma binaries to reduce size
RUN find node_modules/@prisma/engines -type f ! -name 'libquery_engine-*linux-musl-openssl-3.0.x.so.node' -delete 2>/dev/null || true

# Stage 3: Runtime - Final production image
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Install dumb-init for proper signal handling and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy production node_modules from deps stage
COPY --from=deps --chown=backend:nodejs /app/backend/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=backend:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/backend/prisma ./prisma
COPY --from=builder --chown=backend:nodejs /app/backend/package.json ./package.json

# Copy docker entrypoint script
COPY --chown=backend:nodejs apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy Prisma Client generated files from builder
COPY --from=builder --chown=backend:nodejs /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=backend:nodejs /app/backend/node_modules/@prisma ./node_modules/@prisma

# Create uploads and logs directories
RUN mkdir -p /app/uploads /app/backend/logs && \
    chown -R backend:nodejs /app/uploads /app/backend/logs

# Switch to non-root user
USER backend

# Expose application port
EXPOSE 3005

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly (SIGTERM, SIGINT)
ENTRYPOINT ["dumb-init", "--"]

# Start with entrypoint script that handles DB setup
CMD ["./docker-entrypoint.sh"]
