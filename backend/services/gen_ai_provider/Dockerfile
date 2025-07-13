# === Stage 1: Builder ===
FROM python:3.12 AS builder

ARG USER_ID=1001
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements and install to custom prefix
COPY --chmod=0755 --chown=${USER_ID}:0 requirements.txt ./
RUN pip install --upgrade pip && pip install --prefix=/install -r requirements.txt

# Copy app code
COPY --chmod=0755 --chown=${USER_ID}:0 app/ ./app/

# === Stage 2: Final Runtime ===
FROM python:3.12-slim AS runtime

ARG USER_ID=1001
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install curl for healthchecks only
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Define the runtime user manually
RUN echo "${USER_ID}:x:${USER_ID}:${USER_ID}:soai-genai:/nonexistent:/bin/false" > /etc/passwd && \
    echo "${USER_ID}:!::0:::::" > /etc/shadow

# Copy only installed Python packages and app
COPY --from=builder /install /usr/local
COPY --from=builder /app/app ./app

# Metadata
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend GenAI Service" \
    soai.image.created="$BUILD_TIME"

EXPOSE 8004

WORKDIR /app/app

USER ${USER_ID}

CMD ["python", "main.py"]