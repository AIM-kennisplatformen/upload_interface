# Builds the static frontend, then serves it (and reverse-proxies the API
# paths) with Caddy. This is a reference deployment -- it assumes an
# Authentik forward-auth outpost, scepa-rs, and Studio are all reachable
# from wherever this container runs; none of those are started here.

FROM node:22-alpine AS build
WORKDIR /app
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
