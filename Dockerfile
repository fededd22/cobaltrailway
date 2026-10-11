FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---------- frontend build ----------
FROM base AS web-build
WORKDIR /app

# baked into the static build. "self" = the frontend talks to the api that serves it.
# railway passes service variables with the same names as build args.
ARG WEB_DEFAULT_API=self
ARG WEB_HOST
ARG WEB_PLAUSIBLE_HOST
ARG WEB_ENABLE_WEBCODECS
ARG WEB_ENABLE_DEPRECATED_YOUTUBE_HLS
ENV WEB_DEFAULT_API=$WEB_DEFAULT_API \
    WEB_HOST=$WEB_HOST \
    WEB_PLAUSIBLE_HOST=$WEB_PLAUSIBLE_HOST \
    WEB_ENABLE_WEBCODECS=$WEB_ENABLE_WEBCODECS \
    WEB_ENABLE_DEPRECATED_YOUTUBE_HLS=$WEB_ENABLE_DEPRECATED_YOUTUBE_HLS

COPY . /app
RUN pnpm install --frozen-lockfile --filter @imput/cobalt-web...
RUN pnpm --filter @imput/cobalt-web build

# ---------- api build ----------
FROM base AS api-build
WORKDIR /app
COPY . /app

RUN apk add --no-cache python3 alpine-sdk

# note: no `--mount=type=cache` here, railway requires a service-specific
# cache id for cache mounts and rejects the generic one
RUN pnpm install --prod --frozen-lockfile
RUN pnpm deploy --filter=@imput/cobalt-api --prod /prod/api

# ---------- final image: api + frontend ----------
FROM base AS final
WORKDIR /app

COPY --from=api-build --chown=node:node /prod/api /app
COPY --from=web-build --chown=node:node /app/web/build /app/web-build

# .git is not copied: railway's build context doesn't include it.
# commit/branch/remote info comes from RAILWAY_GIT_* variables instead.

ENV WEB_DIR=/app/web-build

USER node

# railway injects PORT at runtime, cobalt reads it automatically
EXPOSE 9000
CMD [ "node", "src/cobalt" ]
