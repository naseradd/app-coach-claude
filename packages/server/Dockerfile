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
RUN pnpm --filter @coach/shared build \
 && pnpm --filter @coach/web build \
 && pnpm --filter @coach/server build \
 && cp -r packages/web/dist packages/server/dist-web

FROM base AS runtime
ENV NODE_ENV=production
# STATIC_DIR is relative to WORKDIR — @hono/node-server serve-static
# does not support absolute paths (it always prepends "./").
ENV STATIC_DIR=dist-web
ENV DB_PATH=/data/coach.db
WORKDIR /app
COPY --from=build /app/packages/server/dist ./dist
COPY --from=build /app/packages/server/dist-web ./dist-web
COPY --from=build /app/packages/server/package.json ./
COPY --from=build /app/packages/shared/dist ./node_modules/@coach/shared/dist
COPY --from=build /app/packages/shared/package.json ./node_modules/@coach/shared/
RUN pnpm install --prod --no-frozen-lockfile --filter @coach/server
EXPOSE 8080
CMD ["node", "dist/index.js"]
