# Friday AI Chat - Production Docker Image

FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@10.20.0 && apk add --no-cache curl

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --no-frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
# Pass build-time VITE_* vars so they're embedded in index.html
ARG VITE_APP_TITLE=Friday AI
ARG VITE_APP_LOGO=/logo.png
ARG VITE_APP_ID=friday-ai
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_APP_ID=$VITE_APP_ID
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime artifacts only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist/public ./dist/public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "dist/index.js"]
