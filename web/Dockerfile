# --- Stage 1: Build React App ---
FROM node:23.1.0 AS builder

WORKDIR /app

# Build recruitment app
COPY recruitment-app/package.json ./recruitment-app/package.json
RUN cd recruitment-app && npm install
COPY recruitment-app/ ./recruitment-app/
RUN cd recruitment-app && npm run build

# Build shell app
COPY shell-app/package.json ./shell-app/package.json
RUN cd shell-app && npm install
COPY shell-app/ ./shell-app/
RUN cd shell-app && npm run build

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
# Serve shell at root and recruitment at /recruitment
COPY --from=builder /app/shell-app/dist /usr/share/nginx/html
COPY --from=builder /app/recruitment-app/dist /usr/share/nginx/html/recruitment

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]