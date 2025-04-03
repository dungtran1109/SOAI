# Use an official Python runtime as the base image
FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the working directory
COPY requirements.txt ./

# Install dependencies
RUN pip install -r requirements.txt

# Copy the application code to the container
COPY app/ .

# Expose the port on which the FastAPI app runs
EXPOSE 8002

# Command to run the FastAPI app using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload","--log-level", "debug"]