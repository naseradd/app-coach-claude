# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/web packages/web
COPY packages/server packages/server
# Build chain. --force on tsc -b avoids skipped emits when buildinfo from host snuck in.
RUN cd packages/shared && pnpm exec tsc -b --force && cd /app \
 && cd packages/web && pnpm exec tsc -b --force && pnpm exec vite build && cd /app \
 && cd packages/server && pnpm exec tsc -b --force && cp -r src/db/sql dist/db/sql && cd /app \
 && cp -r packages/web/dist packages/server/dist-web \
 # pnpm deploy bundles @coach/server + its transitive deps (incl. @coach/shared) into /deploy
 && pnpm --filter @coach/server --prod deploy /deploy

FROM base AS runtime
ENV NODE_ENV=production
# STATIC_DIR is relative to WORKDIR — @hono/node-server serve-static
# does not support absolute paths (it always prepends "./").
ENV STATIC_DIR=dist-web
ENV DB_PATH=/data/coach.db
WORKDIR /app
# pnpm deploy result: /deploy has node_modules + dist + package.json ready to run, no workspace protocol left.
COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./
COPY --from=build /app/packages/server/dist-web ./dist-web
EXPOSE 8080
CMD ["node", "dist/index.js"]
