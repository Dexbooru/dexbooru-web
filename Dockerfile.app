FROM node:24-alpine AS build

ARG VITE_DEXBOORU_NOTIFICATIONS_API_URL
ENV VITE_DEXBOORU_NOTIFICATIONS_API_URL=${VITE_DEXBOORU_NOTIFICATIONS_API_URL}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.15.0 --activate

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

WORKDIR /app

# Coolify post-deploy hooks invoke `pnpm postdeploy`; keep pnpm + bash available.
RUN apk add --no-cache bash \
	&& corepack enable \
	&& corepack prepare pnpm@11.15.0 --activate

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/src/generated ./src/generated

USER node

EXPOSE 5173

CMD ["node", "build/index.js"]
