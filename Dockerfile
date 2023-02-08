FROM node:18-alpine as build

WORKDIR /usr/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/app

COPY --from=build /usr/app ./

ARG DATABASE_CLIENT
ARG DATABASE_URL

RUN npm run knex -- migrate:latest

ENTRYPOINT [ "npm", "run", "start" ]