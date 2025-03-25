FROM node:23.1.0-alpine

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Frontend React Service" \
    soai.image.created="$BUILD_TIME"

WORKDIR /frontend
# Copy the app source code
COPY . .

USER 0

EXPOSE 3000