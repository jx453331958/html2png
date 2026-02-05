# Multi-stage build for HTML to PNG converter (Next.js)
# Use Playwright image as base for all stages to ensure consistent Node version

# Stage 1: Dependencies
FROM mcr.microsoft.com/playwright:v1.58.1-jammy AS deps

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY web/package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Stage 2: Builder
FROM mcr.microsoft.com/playwright:v1.58.1-jammy AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY web/ ./

# Build the application
RUN npm run build

# Stage 3: Production
FROM mcr.microsoft.com/playwright:v1.58.1-jammy

WORKDIR /app

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create non-root user and data directory
RUN groupadd -r html2png && useradd -r -g html2png html2png \
    && mkdir -p /app/data && chown -R html2png:html2png /app

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/html2png.db
ENV PORT=3000
ENV HOST=0.0.0.0

# Switch to non-root user
USER html2png

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "server.js"]
