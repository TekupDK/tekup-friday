# Friday AI Chat - Docker Configuration
FROM node:22-alpine

WORKDIR /app

# Install pnpm and curl for healthcheck
RUN npm install -g pnpm@10.20.0 && \
    apk add --no-cache curl

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start in development mode with watch
CMD ["pnpm", "dev"]
