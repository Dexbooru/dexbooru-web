FROM node:23-alpine3.19

WORKDIR /app

COPY . /app/

RUN yarn install
RUN yarn build


EXPOSE 5173
ENV PORT=5173

CMD ["node", "build/index.js"]