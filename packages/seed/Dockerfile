FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/seed/package.json ./packages/seed/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/seed

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/seed/dist ./packages/seed/dist/
COPY --from=builder /app/packages/seed/package.json ./packages/seed/
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "packages/seed/dist/index.js"]
