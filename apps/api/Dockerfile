FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/

RUN npm install --ignore-scripts

COPY packages/database ./packages/database
COPY apps/api ./apps/api

RUN npm rebuild bcrypt --build-from-source
RUN cd packages/database && npx prisma generate

RUN cd packages/database && \
    npx tsc --outDir dist \
    --esModuleInterop true \
    --module commonjs \
    --target es2017 \
    --moduleResolution node \
    --skipLibCheck \
    src/index.ts

RUN cd apps/api && npx nest build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

RUN mkdir -p node_modules/@zappai && \
    ln -sf /app/packages/database node_modules/@zappai/database

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD npx prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/apps/api/src/main.js
