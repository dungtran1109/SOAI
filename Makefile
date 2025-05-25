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

## Package the helm chart
package-helm:
	@echo "Package helm"
	$(TOP_DIR)/vas.sh build_helm \
		--release=$(RELEASE)
		--user=$(USERNAME)

image: 	image-authentication \
		image-recruitment \
		image-genai \
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
image-web:
	@echo "build web frontend Image"
	$(TOP_DIR)/vas.sh build_image --name=web

run: run-mysql \
	run-consul \
	run-authentication \
	run-genai \
	run-recruitment \
	run-web

run-mysql:
	@echo "Run MySQL Container"
	$(TOP_DIR)/vas.sh run_public_image \
		--image=mysql:latest \
		--name=mysql \
		--port=3306:3306 \
		--env="MYSQL_DATABASE=soai_db \
			MYSQL_ROOT_PASSWORD=root \
			MYSQL_USER=soai_user \
			MYSQL_PASSWORD=soai_password"

wait-mysql:
	@echo "Waiting for MySQL to start (simple wait)..."
	@until docker exec soai_mysql mysqladmin ping -h localhost -uroot -proot --silent; do \
		echo "Waiting for MySQL..."; \
		sleep 2; \
	done

run-consul:
	@echo "Run Consul Container"
	$(TOP_DIR)/vas.sh run_public_image \
		--image=hashicorp/consul:latest \
		--name=consul \
		--port=8500:8500 \
		--cmd="agent -server -bootstrap -ui -client=0.0.0.0"

run-authentication: wait-mysql
	@echo "Run Authentication Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=authentication \
		--port=9090:9090 \
		--env="DB_HOST=soai_mysql \
			DB_PORT=3306 \
			DB_NAME=soai_db \
			DB_USERNAME=soai_user \
			DB_PASSWORD=soai_password"

wait-authentication:
	@echo "Waiting for Authentication container to start..."
	@until docker inspect -f '{{.State.Running}}' soai_authentication | \
		grep true; do sleep 2; done

run-genai:
	@echo "Run GenAI Provider Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=gen_ai_provider \
		--port=8004:8004 \
		--env="CONSUL_HOST=soai_consul:8500 \
			SERVICE_NAME=soai_gen_ai_provider \
			SERVICE_PORT=8004 \
			OPENAI_API_KEY=$(OPENAI_API_KEY) \
			GOOGLE_API_KEY=$(GOOGLE_API_KEY)"

wait-genai:
	@echo "Waiting for GenAI container to start..."
	@until docker inspect -f '{{.State.Running}}' soai_gen_ai_provider | \
		grep true; do sleep 2; done

run-recruitment: wait-mysql wait-authentication wait-genai
	@echo "Run Recruitment Agent Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=recruitment_agent \
		--port=8003:8003 \
		--env="CONSUL_HOST=soai_consul:8500 \
			GENAI_HOST=soai_gen_ai_provider:8004 \
			SERVICE_NAME=soai_recruitment_agent \
			SERVICE_PORT=8003 \
			DB_HOST=soai_mysql \
			DB_PORT=3306 \
			DB_NAME=soai_db \
			DB_USERNAME=soai_user"

run-web:
	@echo "Run Frontend Web Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=web \
		--port=3000:3000 \
		--env="WDS_SOCKET_PORT=0" \
		--cmd="sh -c '/frontend/loader.sh'"

test:	test-recruitment

test-recruitment:
	chmod +x $(RECRUITMENT_DIR)/tests/test_api_recruitment.py
	pip install httpx
	@echo "Automation test for Recruitment Agent"
	$(RECRUITMENT_DIR)/tests/test_api_recruitment.py 2>&1 | \
		tee "$(TOP_DIR)/build/test_api_recruitment.log"

push: 	push-recruitment \
		push-authentication \
		push-genai \
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
push-web:
	@echo "push image-web"
	$(TOP_DIR)/vas.sh push_image --name=web
push-helm:
	@echo "push helm chart"
	$(TOP_DIR)/vas.sh push_helm

remove:		remove-recruitment \
			remove-authentication \
			remove-genai \
			remove-web

remove-recruitment:
	@echo "Remove the Recruitment agent docker image"
	$(TOP_DIR)/vas.sh remove_image --name=recruitment_agent
remove-authentication:
	@echo "Remove the Authentication agent docker image"
	$(TOP_DIR)/vas.sh remove_image --name=authentication
remove-genai:
	@echo "Remove the GenAI provider docker image"
	$(TOP_DIR)/vas.sh remove_image --name=gen_ai_provider
remove-web:
	@echo "Remove the Web frontend docker image"
	$(TOP_DIR)/vas.sh remove_image --name=web

generate-ca:
	@echo "Generate CA files"
	./vas.sh generate_ca