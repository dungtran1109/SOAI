# Use an official Python runtime as the base image
FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

ARG USER_ID=1001
# Copy the requirements file to the working directory
COPY --chmod=0755 --chown=${USER_ID}:0 requirements.txt ./

# Install dependencies
RUN pip install -r requirements.txt

# Copy the application code to the container
COPY . .

RUN echo "${USER_ID}:x:${USER_ID}:${USER_ID}:An Identity for soai-genai:/nonexistent:/bin/false" > /etc/passwd & \
    echo "${USER_ID}:!::0:::::" >> /etc/shadow

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend GenAI Service" \
    soai.image.created="$BUILD_TIME"

# Expose the port on which the FastAPI app runs
EXPOSE 8004

USER ${USER_ID}

# Command to run the FastAPI app using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004", "--reload", "--log-level", "debug"]