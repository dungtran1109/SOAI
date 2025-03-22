#!/bin/sh

# Set defaults if environment variables are not provided
OLLAMA_HOST=${OLLAMA_HOST:-localhost}
OLLAMA_PORT=${OLLAMA_PORT:-11434}

# Start Ollama server in the background
ollama serve &

# Wait a few seconds to ensure the server is up
echo "Waiting 5 seconds for Ollama to start on $OLLAMA_HOST:$OLLAMA_PORT..."
sleep 5

# Pull the llama3:2 model
echo "Pulling llama3.2 model..."
ollama pull llama3.2

# Keep the server running in the foreground
wait
