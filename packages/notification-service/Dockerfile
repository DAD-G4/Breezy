FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/notification-service/package.json ./packages/notification-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/notification-service

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/notification-service/dist ./packages/notification-service/dist/
COPY --from=builder /app/packages/notification-service/package.json ./packages/notification-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3005
CMD ["node", "packages/notification-service/dist/index.js"]
