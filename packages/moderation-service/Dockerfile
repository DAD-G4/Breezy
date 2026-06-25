FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/moderation-service/package.json ./packages/moderation-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/moderation-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/moderation-service/dist ./packages/moderation-service/dist/
COPY --from=builder /app/packages/moderation-service/package.json ./packages/moderation-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3008
CMD ["node", "packages/moderation-service/dist/index.js"]
