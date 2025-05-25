# Makefile

RELEASE := $(RELEASE)
USERNAME := $(USER)
TOP_DIR := $(CURDIR)
version := $(shell $(TOP_DIR)/vas.sh get_version)
DOCKER_CONFIG_DIR ?= build/docker
RECRUITMENT_DIR := $(TOP_DIR)/backend/services/recruitment_agent

# Clean the repository
clean:
	@echo "Clean Repository"
	./vas.sh clean

# Step 1: Login into private docker registry
# Step 2: Run this job to copy docker config to build/docker/config.json
# Step 3: Create docker secret harbordocker
#	kubectl -n <namespace> create secret generic harbordocker \
	--from-file=.dockerconfigjson=build/docker/config.json \
	--type=kubernetes.io/dockerconfigjson
prepare:
	mkdir -p $(DOCKER_CONFIG_DIR)
	cp -rf ~/.docker/config.json $(DOCKER_CONFIG_DIR)/config.json

# Init the repository
init:
	@echo "Create build dataset and model directory"
	$(TOP_DIR)/vas.sh dir_est
	@echo "mkdir variables folder"
	mkdir -p $(TOP_DIR)/build/var
	@if [ "$(RELEASE)" = "true" ]; then \
		echo "Generate release version"; \
		$(TOP_DIR)/vas.sh get_version > $(TOP_DIR)/build/var/.release_version; \
	else \
		echo "Get version prefix"; \
		$(TOP_DIR)/vas.sh get_version > $(TOP_DIR)/build/var/.version; \
	fi

git-tag:
	@echo "Create git tag version"
	$(TOP_DIR)/vas.sh create_git_tag

test-recruitment:
	@echo "Automation test for Recruitment Agent"
	$(RECRUITMENT_DIR)/tests/test_api_recruitment.py 2>&1 | tee "$(TOP_DIR)/build/test_api_recruitment.log"

## Package the helm chart
package-helm:
	@echo "Package helm"
	$(TOP_DIR)/vas.sh build_helm \
		--release=$(RELEASE)
		--user=$(USERNAME)

image: 	image-recruitment \
		image-authentication \
		image-genai \
		image-webserver \
		image-web

image-authentication:
	@echo "build authentication Image"
	$(TOP_DIR)/vas.sh build_image --name=authentication
image-recruitment:
	@echo "build recruitment Image"
	$(TOP_DIR)/vas.sh build_image --name=recruitment_agent
image-genai:
	@echo "build genAI Image"
	$(TOP_DIR)/vas.sh build_image --name=gen_ai_provider
image-webserver:
	@echo "build webserver Image"
	$(TOP_DIR)/vas.sh build_image --name=webserver
image-web:
	@echo "build web frontend Image"
	$(TOP_DIR)/vas.sh build_image --name=web

push: 	push-recruitment \
		push-authentication \
		push-genai \
		push-webserver \
		push-web

push-authentication:
	@echo "push authentication Image"
	$(TOP_DIR)/vas.sh push_image --name=authentication
push-recruitment:
	@echo "push recruitment Image"
	$(TOP_DIR)/vas.sh push_image --name=recruitment_agent
push-genai:
	@echo "push genAI Image"
	$(TOP_DIR)/vas.sh push_image --name=gen_ai_provider
push-webserver:
	@echo "push webserver Image"
	$(TOP_DIR)/vas.sh push_image --name=webserver
push-web:
	@echo "push image-web"
	$(TOP_DIR)/vas.sh push_image --name=web
push-helm:
	@echo "push helm chart"
	$(TOP_DIR)/vas.sh push_helm

generate-ca:
	@echo "Generate CA files"
	./vas.sh generate_ca