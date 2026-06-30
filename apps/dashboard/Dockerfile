FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/dashboard/package*.json ./apps/dashboard/

RUN npm install --ignore-scripts

COPY apps/dashboard ./apps/dashboard

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN cd apps/dashboard && /app/node_modules/.bin/next build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder /app/apps/dashboard/next.config.js ./apps/dashboard/next.config.js

EXPOSE 3000

CMD ["/app/node_modules/.bin/next", "start", "-p", "3000", "--prefix", "apps/dashboard"]
