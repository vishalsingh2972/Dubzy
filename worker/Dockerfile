FROM oven/bun:1.3.2-alpine AS deps

WORKDIR /app/worker

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

FROM oven/bun:1.3.2-alpine AS prod-deps

WORKDIR /app/worker

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:24-alpine AS runtime

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production

WORKDIR /app/worker

COPY --from=build --chown=node:node /app/worker/package.json ./
COPY --from=prod-deps --chown=node:node /app/worker/node_modules ./node_modules
COPY --from=build --chown=node:node /app/worker/dist ./dist

USER node

CMD ["node", "dist/worker.js"]
