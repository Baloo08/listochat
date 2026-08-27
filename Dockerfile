# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads && chown -R node:node uploads
USER node
ENV NODE_ENV=production PORT=3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/api/health || wget -q --spider http://127.0.0.1:80/api/health || wget -q --spider http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/server.js"]

