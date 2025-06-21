# --- Stage 1: Build React App ---
FROM node:23.1.0 AS builder

WORKDIR /app

COPY main-app/package.json ./
RUN npm install

COPY main-app/ ./
RUN npm run build

# --- Stage 2: Serve with nginx-unprivileged ---
FROM nginxinc/nginx-unprivileged:latest

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
  soai.app.commit=$COMMIT \
  soai.app.version=$APP_VERSION \
  soai.image.title="SOAI React Frontend (Nginx Non-Root)" \
  soai.image.created=$BUILD_TIME

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]