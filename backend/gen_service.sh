#!/bin/bash

# Base project directory
BASE_DIR="$PWD/services/$1"

# Create the main app structure
mkdir -p $BASE_DIR/app/{models,routers,services,config,utils}
touch $BASE_DIR/app/{__init__.py,main.py}
touch $BASE_DIR/app/models/{__init__.py,${1}_model.py}
touch $BASE_DIR/app/routers/{__init__.py,${1}_router.py}
touch $BASE_DIR/app/services/{__init__.py,${1}_service.py}
touch $BASE_DIR/app/config/{__init__.py,constants.py}
touch $BASE_DIR/app/utils/{__init__.py,helpers.py}

# Create project root files
touch $BASE_DIR/{requirements.txt,README.md,.env}
mkdir -p $BASE_DIR/tests
touch $BASE_DIR/tests/{__init__.py,test_${1}.py}

echo "Folder structure for FastAPI service created successfully!"
