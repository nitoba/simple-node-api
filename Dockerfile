FROM node:18-alpine as build

WORKDIR /usr/app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/app

COPY --from=build /usr/app ./

ENV DATABASE_CLIENT=pg
ENV DATABASE_URL=./db/app.db
ENV PORT=3333

ENTRYPOINT [ "npm", "run", "start" ]