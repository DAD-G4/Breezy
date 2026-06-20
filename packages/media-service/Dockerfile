FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/media-service/package.json ./packages/media-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/media-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/media-service/dist ./packages/media-service/dist/
COPY --from=builder /app/packages/media-service/package.json ./packages/media-service/
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p packages/media-service/uploads

EXPOSE 3007
CMD ["node", "packages/media-service/dist/index.js"]
