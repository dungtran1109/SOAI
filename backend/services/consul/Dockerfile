FROM hashicorp/consul:latest

# hashicorp/consul image has already run as consul user
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Consul Service" \
    soai.image.created="$BUILD_TIME"