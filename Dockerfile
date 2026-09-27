FROM node:24.21.0-alpine3.24 AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 8080

FROM node:24.21.0-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test
FROM nginxinc/nginx-unprivileged:1.30.5-alpine3.24
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/panel-web/browser /usr/share/nginx/html
EXPOSE 8080
