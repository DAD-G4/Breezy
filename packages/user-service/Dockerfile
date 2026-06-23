FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/user-service/package.json ./packages/user-service/
RUN npm install

COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/user-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/user-service/dist ./packages/user-service/dist/
COPY --from=builder /app/packages/user-service/package.json ./packages/user-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002
CMD ["node", "packages/user-service/dist/index.js"]
