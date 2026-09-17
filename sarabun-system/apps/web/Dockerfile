FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN npm run build

# Production Web Server with Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
