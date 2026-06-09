# Base image (shared)
FROM node:22-alpine AS base
WORKDIR /app

# -------------------
# Development stage
# -------------------
FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
USER node

# -------------------
# Build stage
# -------------------
FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# -------------------
# Production stage
# -------------------
FROM node:22-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated/prisma ./src/generated/prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts


# Run migrations then start
CMD sh -c "npx prisma migrate deploy && node dist/src/main.js"
