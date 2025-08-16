FROM node:23-alpine3.19

WORKDIR /app

RUN npm install -g pnpm

COPY . /app/

RUN pnpm install 
RUN pnpm build

EXPOSE 5173
ENV PORT=5173
ENV ORIGIN=http://localhost:5173

CMD ["node", "build/index.js"]