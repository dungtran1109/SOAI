# Makefile

RELEASE := $(RELEASE)
USERNAME := $(USER)
TOP_DIR := $(CURDIR)
version := $(shell $(TOP_DIR)/vas.sh get_version)
DOCKER_CONFIG_DIR ?= build/docker
RECRUITMENT_DIR := $(TOP_DIR)/backend/services/recruitment_agent

# Health check
RETRIES ?= 10
INTERVAL ?= 15
TIMEOUT ?= 10

# Clean the repository
clean:
	@echo "Clean Repository"
	./vas.sh clean

# Step 1: Login into private docker registry
# Step 2: Run this job to copy docker config to build/docker/config.json
# Step 3: Create docker secret pullsecret
#	kubectl -n <namespace> create secret generic pullsecret \
	--from-file=.dockerconfigjson=build/docker/config.json \
	--type=kubernetes.io/dockerconfigjson
prepare:
	mkdir -p $(DOCKER_CONFIG_DIR)
	cp -rf ~/.docker/config.json $(DOCKER_CONFIG_DIR)/config.json

# Init the repository
init:
	@echo "Create build folder"
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
package-helm: generate-ca
	@echo "Package helm"
	$(TOP_DIR)/vas.sh build_helm \
		--release=$(RELEASE)
		--user=$(USERNAME)

# Run this one to build all images for CI/CD
image-ci: image-authentication \
		image-recruitment \
		image-genai

image: 	image-authentication \
		image-recruitment \
		image-genai \
		image-web \
		image-controller

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
image-controller:
	@echo "build agent controller Image"
	$(TOP_DIR)/vas.sh build_image --name=agent_controller

# Run this one to run all services for CI/CD
run-ci: 	run-mysql \
			run-redis \
			run-consul \
			run-authentication \
			run-genai \
			run-recruitment \
			run-recruitment-celery-worker

run: run-mysql \
	run-redis \
	run-consul \
	run-authentication \
	run-genai \
	run-recruitment \
	run-recruitment-celery-worker \
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

run-redis:
	@echo "Run Redis Container"
	$(TOP_DIR)/vas.sh run_public_image \
		--image=redis:7 \
		--name=redis \
		--port=6379:6379

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
			GOOGLE_API_KEY=$(GOOGLE_API_KEY) \
			LOG_LEVEL=INFO"

wait-genai:
	@echo "Waiting for GenAI container to start..."
	@until docker inspect -f '{{.State.Running}}' soai_gen_ai_provider | \
		grep true; do sleep 2; done

run-recruitment: wait-mysql wait-authentication wait-genai
	@echo "Run Recruitment Agent Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=recruitment_agent \
		--port=8003:8003 \
		--volume_name=soai_recruitment_shared \
		--volume_target=/app/app/cv_uploads \
		--env="CONSUL_HOST=soai_consul:8500 \
			GENAI_HOST=soai_gen_ai_provider:8004 \
			SERVICE_NAME=soai_recruitment_agent \
			SERVICE_PORT=8003 \
			DB_HOST=soai_mysql \
			DB_PORT=3306 \
			DB_NAME=soai_db \
			DB_USERNAME=soai_user \
			REDIS_HOST=soai_redis \
			REDIS_PORT=6379 \
			CELERY_BROKER_URL=redis://soai_redis:6379/0 \
			CELERY_RESULT_BACKEND=redis://soai_redis:6379/0 \
			CELERY_TASK_TIME_LIMIT=600 \
			CELERY_TASK_SOFT_TIME_LIMIT=500 \
			CELERY_TIMEZONE=Asia/Ho_Chi_Minh \
			LOG_LEVEL=INFO"

run-recruitment-celery-worker:
	@echo "Run celery worker for recruitment"
	$(TOP_DIR)/vas.sh run_image \
		--name=recruitment_agent-celery-worker \
		--name_override=recruitment_agent \
		--volume_name=soai_recruitment_shared \
		--volume_target=/app/app/cv_uploads \
		--env="CONSUL_HOST=soai_consul:8500 \
			GENAI_HOST=soai_gen_ai_provider:8004 \
			SERVICE_NAME=soai_recruitment_agent \
			SERVICE_PORT=8003 \
			DB_HOST=soai_mysql \
			DB_PORT=3306 \
			DB_NAME=soai_db \
			DB_USERNAME=soai_user \
			REDIS_HOST=soai_redis \
			REDIS_PORT=6379 \
			CELERY_BROKER_URL=redis://soai_redis:6379/0 \
			CELERY_RESULT_BACKEND=redis://soai_redis:6379/0 \
			CELERY_TASK_TIME_LIMIT=600 \
			CELERY_TASK_SOFT_TIME_LIMIT=500 \
			CELERY_TIMEZONE=Asia/Ho_Chi_Minh \
			LOG_LEVEL=INFO" \
		--cmd="celery -A celery_worker worker --loglevel=info"

run-web:
	@echo "Run Frontend Web Container"
	$(TOP_DIR)/vas.sh run_image \
		--name=web \
		--port=8080:8080

check-health: \
	check-authentication-health \
	check-genai-health \
	check-recruitment-health

check-authentication-health:
	@echo "Checking Authentication health..."
	@$(MAKE) check-url-health URL=http://localhost:9090/actuator/health NAME=Authentication

check-genai-health:
	@echo "Checking GenAI Provider health..."
	@$(MAKE) check-url-health URL=http://localhost:8004/api/v1/gen-ai/health NAME=GenAI

check-recruitment-health:
	@echo "Checking Recruitment Agent health..."
	@$(MAKE) check-url-health URL=http://localhost:8003/api/v1/recruitment/health NAME=Recruitment

# common function
check-url-health:
	@i=0; \
	while [ $$i -lt $(RETRIES) ]; do \
		if curl -fs --max-time $(TIMEOUT) "$$URL" > /dev/null; then \
			echo "$$NAME is healthy"; exit 0; \
		else \
			echo "Waiting for $$NAME to be healthy (attempt $$((i+1)) of $(RETRIES))..."; \
			sleep $(INTERVAL); \
		fi; \
		i=$$((i+1)); \
	done; \
	echo "$$NAME health check failed after $(RETRIES) attempts"; exit 1

test:	test-recruitment \
	collect-authentication-log \
	collect-gen-ai-log \
	collect-recruitment-log

# Avoid to generate __pycache__ when running test because it will generate as root user.
# Permission issue can not delete the __pycache__.
test-recruitment:
	@echo "Automation test for Recruitment Agent using Docker"
	docker run --rm \
		--network=host \
		-e PYTHONDONTWRITEBYTECODE=1 \
		-e HOST_NAME="localhost" \
		-e TLS_ENABLED="false" \
		-v $(RECRUITMENT_DIR):/app -w /app/tests python:3.11-slim bash -c "\
		apt-get update && apt-get install -y curl && \
		pip install httpx && \
		python test_api_recruitment.py"
collect-authentication-log:
	@echo "Collect SOAI_AUTHENTICATION logs"
	$(TOP_DIR)/vas.sh collect_docker_logs --name=authentication
collect-gen-ai-log:
	@echo "Collect SOAI_GEN_AI_PROVIDER logs"
	$(TOP_DIR)/vas.sh collect_docker_logs --name=gen_ai_provider
collect-recruitment-log:
	@echo "Collect SOAI_RECRUITMENT logs"
	$(TOP_DIR)/vas.sh collect_docker_logs --name=recruitment_agent

push-ci: 	push-recruitment \
			push-authentication \
			push-genai
push: 	push-recruitment \
		push-authentication \
		push-genai \
		push-web \
		push-controller \
		push-helm

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
push-controller:
	@echo "push controller Image"
	$(TOP_DIR)/vas.sh push_image --name=agent_controller
push-helm:
	@echo "push helm chart"
	$(TOP_DIR)/vas.sh push_helm

remove-ci: 	remove-recruitment \
			remove-authentication \
			remove-genai \
			remove-consul \
			remove-mysql \
			remove-recruitment-celery-worker \
			remove-redis

remove:		remove-recruitment \
			remove-authentication \
			remove-genai \
			remove-web \
			remove-consul \
			remove-mysql \
			remove-recruitment-celery-worker \
			remove-controller \
			remove-redis

# Recruitment containers
remove-recruitment:
	@echo "Remove the Recruitment agent container, image, and its shared volume"
	$(TOP_DIR)/vas.sh remove_image \
		--name=recruitment_agent \
		--volume_name=soai_recruitment_shared \
		--remove_volume=true

remove-recruitment-celery-worker:
	@echo "Remove the Recruitment celery worker container"
	$(TOP_DIR)/vas.sh remove_image \
		--name=recruitment_agent-celery-worker

# Other services (no volume cleanup needed)
remove-authentication:
	@echo "Remove the Authentication agent docker image"
	$(TOP_DIR)/vas.sh remove_image --name=authentication

remove-genai:
	@echo "Remove the GenAI provider docker image"
	$(TOP_DIR)/vas.sh remove_image --name=gen_ai_provider

remove-controller:
	@echo "Remove the Agent Controller docker image"
	$(TOP_DIR)/vas.sh remove_image --name=agent_controller

remove-web:
	@echo "Remove the Web frontend docker image"
	$(TOP_DIR)/vas.sh remove_image --name=web

remove-consul:
	@echo "Remove the Consul docker image"
	$(TOP_DIR)/vas.sh remove_public_image --name=consul

remove-mysql:
	@echo "Remove the MySQL docker image"
	$(TOP_DIR)/vas.sh remove_public_image --name=mysql

remove-redis:
	@echo "Remove the Redis docker image"
	$(TOP_DIR)/vas.sh remove_public_image --name=redis

generate-ca:
	@echo "Generate CA files"
	./vas.sh generate_ca
