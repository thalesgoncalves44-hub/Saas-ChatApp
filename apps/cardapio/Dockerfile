FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/cardapio/package*.json ./apps/cardapio/

RUN npm install --ignore-scripts

COPY apps/cardapio ./apps/cardapio

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN cd apps/cardapio && /app/node_modules/.bin/next build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/cardapio/.next ./apps/cardapio/.next
COPY --from=builder /app/apps/cardapio/public ./apps/cardapio/public
COPY --from=builder /app/apps/cardapio/package.json ./apps/cardapio/package.json
COPY --from=builder /app/apps/cardapio/next.config.js ./apps/cardapio/next.config.js

EXPOSE 3002

CMD ["/app/node_modules/.bin/next", "start", "-p", "3002", "--prefix", "apps/cardapio"]
