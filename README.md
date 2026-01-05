# SOAI Project Developing Multiple AI-AGENTs.

![ReactJS](https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=java&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Apache Maven](https://img.shields.io/badge/Apache%20Maven-C71A36?style=for-the-badge&logo=Apache%20Maven&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![MySQL](https://img.shields.io/badge/MySQL-blue?style=for-the-badge&logo=MYSQL&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-green?style=for-the-badge&logo=spring-boot&logoColor=white)

SOAI repository works as MCP AI Agent connection within microservices running on Kubernetes environment. This repository based on the LangGraph Agent, with Generative AI.

---
The repository 

## Contents

- [SOAI Project](#soai-project-developing-multiple-ai-agent)
  - [Contents](#contents)
  - [Developer's Guide](#developers-guide)
    - [Getting Started](#getting-started)
      - [Development Environment](#development-environment)
      - [How to use](#how-to-use)
  - [Deploy helm chart to k8s cluster](#deploy-helm-chart-to-k8s-cluster)
  - [Pushing the docker image to registry and release helm chart](#pushing-the-docker-image-to-registry-and-release-helm-chart)

## Developer's Guide

### Getting Started

#### Development Environment

The recommend standard development environment is Ubuntu 18.04 LTS or later. You must install Docker, K8s Cluster Resource or minikube, Helm. 

### Recruitment Agent
#### Documentation and Workplace
Please view at [Recruitment Agent]("https://gitlab.endava.com/cuong.quang.nguyen/soai/-/tree/main/backend/services/recruitment_agent?ref_type=heads")
#### Local Development
1. All the docker container started by docker-compose.yml for development. Hot reloading are enabled and will apply the changes with the host mounted between local
and docker container.
To start all the components
```bash
$ docker compose up -d
```

This will install dependencies and recruitment docker container start for you. This will run authentication for JWT verification and MySQL database for storing database.

You must export the `OPENAI_API_KEY` under environment
```bash
$ export OPENAI_API_KEY=<your-api-key>
```

In case you wish to develop ReactJS Frontend without Docker built. So you need to have a look on [constants.js](web/main-app/src/constants/constants.js). And uncomment two lines below

```bash
// This exports used for calling the nginx proxy after docker built
// export const AUTH_BASE_URL = "/api/v1";
// export const API_HOST = ""
// If you want to run in the local environment without Docker,
// you can uncomment the lines below and comment the above lines.
export const AUTH_BASE_URL = "http://localhost:9090/api/v1";
export const API_HOST = "http://localhost:8003"

export const API_BASE_URL = `${API_HOST}/api/v1`;
```

And start the recruitment server only. This will only run neccessary dependencies (DB, redis) and server for authenticating and API server.

```bash
$ docker compose up -d recruitment
```

2. If you want to test APIs, run
```
$ make test-recruitment
```

## Deploy helm chart to k8s cluster
### Prepare
1. **Install the k8s cluster** (minikube/k3s for testing). Following page: https://docs.k3s.io/quick-start
```bash
$ curl -sfL https://get.k3s.io | sh -
```

2. **Install `kubectl` and `helm`**. Following the documentation: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/ and https://helm.sh/docs/intro/install/

To install kubectl
```bash
$ curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
$ chmod +x kubectl
$ sudo mv kubectl /usr/local/bin/
```

To install helm
```bash
$ curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
$ chmod 700 get_helm.sh
$ ./get_helm.sh
```

3. **(Optional) Install monitoring stack** (prometheus, grafana)

If you want to install monitoring tools, go to `test/athena_chart` and run:
```bash
$ ./deploy.sh -n monitoring
```

You can install the cert-manager, prometheus, grafana to monitor and create `cert-manager` CRDs in order to deploy TLS certificates in SOAI-application.

4. **Get the latest released version** and override the version in `build/var/.version`
```bash
$ latest_version=$(git describe --tags `git rev-list --tags --max-count=1`)
$ echo $latest_version > build/var/.version
```

5. **Package helm-chart**
```bash
$ make package-helm
```
The helm build will locate at `build/helm-build/soai-application/` folder

You can preview the helm chart by:
```bash
$ helm template soai-app build/helm-build/soai-application/soai-application/
```

6. **Deploy SOAI application**

Export the `OPENAI_API_KEY` in your environment:
```bash
$ export OPENAI_API_KEY=<your-api-key>
```

Install the SOAI helm chart to k8s cluster:
```bash
$ helm -n <namespace> install soai-app build/helm-build/soai-application/soai-application-<version>.tgz \
    --set openai.apiKey=$OPENAI_API_KEY \
    --debug \
    --create-namespace
```

**Example:**
```bash
$ helm -n soai install soai-app build/helm-build/soai-application/soai-application-1.2.0-79556139999.tgz \
    --set openai.apiKey=$OPENAI_API_KEY \
    --debug \
    --create-namespace
```

7. **Verify installation**

The result looks like this after you done the installation:
```bash
$ k $NAME get po
NAME                                               READY   STATUS    RESTARTS   AGE
clickhouse-0                                       1/1     Running   0          4m41s
grafana-8d59bb64b-xxqd7                            1/1     Running   0          4m51s
otel-collector-6c855f87b5-g5x5l                    1/1     Running   0          4m51s
redis-7b986b9f57-m68vj                             1/1     Running   0          4m51s
soai-application-authentication-645c7899f8-5wh5c   1/1     Running   0          4m51s
soai-application-consul-5d57d7f649-psmgd           1/1     Running   0          4m51s
soai-application-genai-b9475b9fd-nlvl6             1/1     Running   0          4m51s
soai-application-mysql-0                           1/1     Running   0          4m43s
soai-application-recruitment-7844644774-9nt2h      2/2     Running   0          4m50s
soai-application-web-84ff858bbb-s58td              1/1     Running   0          4m50s
```

# Login to Grafana
Username: admin
Password: admin@123

## Pushing the docker image to registry and release helm chart
### Prepare
1. To release the docker images and helm chart. Check out `vas.sh` and `Makefile` script.
Set the `RELEASE` variable to true
```bash
$ export RELEASE=true
```
2. Create release version. This can be done via `Makefile`.
To check the version release. The version will change based on commit hash and number of commit pushed.
```bash
$ ./vas.sh get_version
```
3. Create drop version.
```bash
$ make clean init image push
```
This will sent and push the drop version to docker registry. Helm will manage to push to registry also.
5. Create tag version after release the drop tag version of docker images and helm chart.
```bash
$ make git-tag
```
This will create the git tag and push to git.
### License
This repository is proprietary and confidential. Usage is subject to internal policies. Contact maintainers for access or usage rights.