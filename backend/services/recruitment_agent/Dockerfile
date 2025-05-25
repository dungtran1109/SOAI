# Use an official Python runtime as the base image
FROM python:3.12

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

ARG USER_ID=1001
COPY --chmod=0755 --chown=${USER_ID}:0 requirements.txt ./
COPY --chmod=0755 --chown=${USER_ID}:0 .env ./

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY --chmod=0755 --chown=${USER_ID}:0 app/ ./app/

RUN echo "${USER_ID}:x:${USER_ID}:${USER_ID}:An Identity for soai-recruitment:/nonexistent:/bin/false" > /etc/passwd & \
    echo "${USER_ID}:!::0:::::" >> /etc/shadow

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Recruitment Service" \
    soai.image.created="$BUILD_TIME"

EXPOSE 8003

WORKDIR /app/app

USER ${USER_ID}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--reload", "--log-level", "debug"]
