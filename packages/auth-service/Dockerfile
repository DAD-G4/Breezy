FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth-service/package.json ./packages/auth-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/auth-service

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/auth-service/dist ./packages/auth-service/dist/
COPY --from=builder /app/packages/auth-service/package.json ./packages/auth-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "packages/auth-service/dist/index.js"]
