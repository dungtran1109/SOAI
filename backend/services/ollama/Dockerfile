# Use the official Ollama image as the base
FROM ollama/ollama

# Expose the default Ollama port
EXPOSE 11434

# Build arguments
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

# Labels for metadata
LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Ollama Service" \
    soai.image.created="$BUILD_TIME"

COPY --chmod=0755 initenv.sh /initenv.sh

ENTRYPOINT ["/initenv.sh"]