#!/bin/bash

# Define the base directory, default to current if not specified
BASE_DIR=${1:-.}

echo "Searching for __pycache__ directories in $BASE_DIR"

# Find and remove __pycache__ directories
find "$BASE_DIR" -type d -name "__pycache__" -exec rm -rf {} +

echo "All __pycache__ directories have been removed."
