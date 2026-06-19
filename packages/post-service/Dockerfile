FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/post-service/package.json ./packages/post-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/post-service

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/post-service/dist ./packages/post-service/dist/
COPY --from=builder /app/packages/post-service/package.json ./packages/post-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3003
CMD ["node", "packages/post-service/dist/index.js"]
