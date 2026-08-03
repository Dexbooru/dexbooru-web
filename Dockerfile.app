FROM node:24-alpine AS build

ARG VITE_DEXBOORU_NOTIFICATIONS_API_URL
ENV VITE_DEXBOORU_NOTIFICATIONS_API_URL=${VITE_DEXBOORU_NOTIFICATIONS_API_URL}

WORKDIR /app

RUN npm install --global pnpm@11.15.0

COPY . .

# Set temporary postgres database url env variable and install dependencies
RUN DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused \
	pnpm install --frozen-lockfile

# Generate Prisma client used by the app and post-deploy data migrations.
RUN DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused \
	pnpm exec prisma generate --schema ./prisma/schema

# Build the SvelteKit Node adapter output.
RUN DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused \
	pnpm exec vite build

# Compile worker_threads modules into a stable build/workers path
RUN pnpm build:workers \
	&& echo "Worker thread modules compiled:" \
	&& ls -la build/workers \
	&& test -f build/workers/manifest.json \
	&& test -f build/workers/imageTransformWorker.js

RUN pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5173
# pnpm 11 defaults verifyDepsBeforeRun=install, which tries to rewrite node_modules
# on `pnpm run`/`pnpm exec` and fails in the read-mostly runtime image.
ENV PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false

WORKDIR /app

# Coolify post-deploy may invoke pnpm; keep a preinstalled pnpm + bash available.
# Avoid corepack runtime downloads (permission issues under USER node).
RUN apk add --no-cache bash \
	&& npm install --global pnpm@11.15.0 \
	&& chown node:node /app

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=node:node /app/.npmrc ./.npmrc
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/src/generated ./src/generated

USER node

EXPOSE 5173

CMD ["node", "build/index.js"]
