# === Stage 1: Build Python dependencies ===
FROM python:3.12-slim AS builder

ARG USER_ID=1001

# System setup
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements and install Python packages into isolated folder
COPY --chmod=0755 --chown=${USER_ID}:0 requirements.txt ./
RUN pip install --upgrade pip && pip install --prefix=/install --no-cache-dir -r requirements.txt

# Copy source code
COPY --chmod=0755 --chown=${USER_ID}:0 app/ ./app/

# === Stage 2: Final runtime image ===
FROM python:3.12-slim

ARG USER_ID=1001
ENV HOME=/home/soai_user
ENV PYTHONPATH=/app/app
WORKDIR /app

# Create user with real home directory
RUN useradd -u ${USER_ID} -m -d /home/soai_user -s /usr/sbin/nologin soai_user

# Copy Python dependencies and app code from builder
COPY --from=builder /install /usr/local
COPY --from=builder /app/app ./app

# Metadata
ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend knowledge base Service" \
    soai.image.created="$BUILD_TIME"

# Expose app port
EXPOSE 8006

# Set working directory to app root
WORKDIR /app/app

# Set the correct user and home for LibreOffice to work
USER ${USER_ID}
ENV HOME=/home/soai_user

CMD ["python", "main.py"]
