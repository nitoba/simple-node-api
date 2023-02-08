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

ENV DATABASE_URL $DATABASE_URL
ENV DATABASE_CLIENT $DATABASE_CLIENT

RUN echo $DATABASE_URL
RUN echo $DATABASE_CLIENT

RUN npm run knex -- migrate:latest

ENTRYPOINT [ "npm", "run", "start" ]