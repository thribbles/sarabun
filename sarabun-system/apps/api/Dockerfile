FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate Prisma Client
RUN npx prisma generate --schema src/prisma/schema.prisma

# Build NestJS API
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
COPY apps/api/package.json ./apps/api/
RUN npm install --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/prisma ./apps/api/src/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

EXPOSE 3001

# Push Prisma schema to PostgreSQL and start server
CMD ["sh", "-c", "npx prisma db push --schema src/prisma/schema.prisma --accept-data-loss && node dist/main.js"]
