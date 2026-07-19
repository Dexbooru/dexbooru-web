FROM node:24-alpine AS build

ARG VITE_DEXBOORU_NOTIFICATIONS_API_URL
ENV VITE_DEXBOORU_NOTIFICATIONS_API_URL=${VITE_DEXBOORU_NOTIFICATIONS_API_URL}

WORKDIR /app

RUN npm install --global pnpm@11.15.0

COPY . .

RUN DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused \
	pnpm install --frozen-lockfile
RUN DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused \
	pnpm build
RUN pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5173

WORKDIR /app

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 5173

CMD ["node", "build/index.js"]