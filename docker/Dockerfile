# Multi-stage build for HTML to PNG converter

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci --only=production

# Stage 2: Production
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

# Create non-root user
RUN groupadd -r html2png && useradd -r -g html2png html2png

# Copy built dependencies
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy application code
COPY server/ ./server/
COPY public/ ./public/

# Create data directory
RUN mkdir -p /app/data && chown -R html2png:html2png /app

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
WORKDIR /app/server
CMD ["node", "src/index.js"]
