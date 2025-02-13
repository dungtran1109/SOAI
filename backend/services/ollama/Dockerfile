# Use the official Ollama image as the base
FROM ollama/ollama

# Expose the default Ollama port
EXPOSE 11434

# Build arguments
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Ollama Service" \
    soai.image.created="$BUILD_TIME"

ARG USER_ID=1001
# Ensure user exists and has the correct home directory
RUN addgroup --gid ${USER_ID} soai-group && \
    adduser --disabled-password --gecos "" --uid ${USER_ID} --gid ${USER_ID} --home /home/soai-ollama soai-ollama

# Ensure the directory is writable
RUN mkdir -p /home/soai-ollama/.ollama && chown -R soai-ollama:soai-group /home/soai-ollama/.ollama

# Set working directory
WORKDIR /home/soai-ollama/.ollama

# Switch to the new user
USER soai-ollama