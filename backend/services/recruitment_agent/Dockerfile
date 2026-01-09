# === Stage 1: Build Python dependencies ===
FROM python:3.12-slim AS builder

ARG USER_ID=1001

# System setup
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements and install Python packages into isolated folder
COPY --chmod=0755 --chown=${USER_ID}:0 requirements.txt ./
COPY --chmod=0755 --chown=${USER_ID}:0 .env ./
RUN pip install --upgrade pip && pip install --prefix=/install --no-cache-dir -r requirements.txt

# Copy source code
COPY --chmod=0755 --chown=${USER_ID}:0 app/ ./app/


# === Stage 2: Final runtime image ===
FROM python:3.12-slim

ARG USER_ID=1001
ENV HOME=/home/soai_user \
    PYTHONPATH=/app/app
WORKDIR /app

# Install system dependencies and LibreOffice-headless
# We don't need the full LibreOffice suite, just the core components for document processing
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        libreoffice-core-nogui \
        libreoffice-writer-nogui \
        ure \
        fonts-dejavu-core \
        libglib2.0-0 libsm6 libxext6 libxrender1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user with real home directory
ARG USER_ID=1001
RUN useradd -u ${USER_ID} -m -d /home/soai_user -s /usr/sbin/nologin soai_user

# Copy Python dependencies and app code from builder
COPY --from=builder /install /usr/local
COPY --from=builder /app/app ./app
COPY --from=builder /app/.env .env

RUN chown -R ${USER_ID}:${USER_ID} /app

# Metadata
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Recruitment Service" \
    soai.image.created="$BUILD_TIME"

# Expose app port
EXPOSE 8003

# Set working directory to app root
WORKDIR /app/app

# Set the correct user and home for LibreOffice to work
ARG USER_ID=1001
USER ${USER_ID}
ENV HOME=/home/soai_user \
    LIBREOFFICE_HEADLESS=1 \
    UNO_PATH=/usr/lib/libreoffice/program \
    PATH="$PATH:/usr/lib/libreoffice/program"
CMD ["python", "main.py"]
