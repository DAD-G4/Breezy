FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/dm-service/package.json ./packages/dm-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/dm-service

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/dm-service/dist ./packages/dm-service/dist/
COPY --from=builder /app/packages/dm-service/package.json ./packages/dm-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3006
CMD ["node", "packages/dm-service/dist/index.js"]
