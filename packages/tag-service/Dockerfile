FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tag-service/package.json ./packages/tag-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/tag-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/tag-service/dist ./packages/tag-service/dist/
COPY --from=builder /app/packages/tag-service/package.json ./packages/tag-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3004
CMD ["node", "packages/tag-service/dist/index.js"]
