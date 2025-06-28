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

2. For recruitment agent.
The repository used `sqlachemy` to automate create tables and structure all SQL database for you. So don't need to create tables manually. Check the database is created with
```bash
$ docker exec -it soai_mysql mysql -usoai_user -psoai_password;
$ use soai_db;
$ show tables;
```
3. Recruitment API Endpoint Summary

| Endpoint                                                       | Method | Description                                      | Request Parameters / Body                                                                 | Auth Required | Role Access        |
|----------------------------------------------------------------|--------|--------------------------------------------------|--------------------------------------------------------------------------------------------|---------------|---------------------|
| `/cvs/upload`                                                  | POST   | Upload and parse candidate CV                    | FormData: `file`, `override_email` (optional), `position_applied_for`                      | Yes           | All authenticated   |
| `/jds/upload`                                                  | POST   | Upload job descriptions (JSON format)            | FormData: `file` (JSON array of JDs)                                                       | Yes           | ADMIN only          |
| `/cvs/{candidate_id}/approve`                                  | POST   | Approve a candidate’s CV                         | Path: `candidate_id`                                                                       | Yes           | ADMIN only          |
| `/cvs/pending`                                                 | GET    | Get list of CVs with `PENDING` status            | Query: `candidate_name` (optional)                                                         | Yes           | ADMIN only          |
| `/cvs/{cv_id}`                                                 | PUT    | Update a CV application                          | Path: `cv_id`, JSON Body: fields to update                                                 | Yes           | ADMIN only          |
| `/cvs/{cv_id}`                                                 | DELETE | Delete a CV application                          | Path: `cv_id`                                                                              | Yes           | ADMIN only          |
| `/cvs/position`                                                | GET    | List all CVs (optionally filter by position)     | Query: `position` (optional)                                                               | Yes           | ADMIN only          |
| `/cvs/{cv_id}`                                                 | GET    | Get CV detail by ID                              | Path: `cv_id`                                                                              | Yes           | ADMIN only          |
| `/interviews/schedule`                                         | POST   | Schedule an interview                            | JSON Body: `InterviewScheduleCreateSchema`                                                 | Yes           | ADMIN only          |
| `/interviews/{interview_id}`                                   | PUT    | Update an interview                              | JSON Body: fields to update                                                                | Yes           | ADMIN only          |
| `/interviews/{interview_id}/cancel`                            | POST   | Candidate cancels an interview                   | Path: `interview_id`                                                                       | Yes           | All authenticated   |
| `/interviews`                                                  | GET    | Get list of interviews                           | Query: `interview_date`, `candidate_name` (optional)                                       | Yes           | ADMIN only          |
| `/interviews/accept`                                           | POST   | Candidate accepts an interview                   | JSON Body: `InterviewAcceptSchema`                                                         | Yes           | All authenticated   |
| `/interviews/{interview_id}`                                   | DELETE | Delete a specific interview                      | Path: `interview_id`                                                                       | Yes           | ADMIN only          |
| `/interviews`                                                  | DELETE | Delete all interviews (optionally by candidate)  | Query: `candidate_name` (optional)                                                         | Yes           | ADMIN only          |
| `/jds`                                                         | GET    | Get list of job descriptions                     | Query: `position` (optional)                                                               | Yes           | All authenticated   |
| `/jds/{jd_id}`                                                 | PUT    | Update a job description                         | JSON Body: fields to update                                                                | Yes           | ADMIN only          |
| `/jds/{jd_id}`                                                 | DELETE | Delete a job description                         | Path: `jd_id`                                                                              | Yes           | ADMIN only          |
| `/interview-questions/{cv_id}/questions`                       | GET    | Get generated interview questions for a CV       | Path: `cv_id`                                                                              | Yes           | ADMIN only          |
| `/interview-questions/{question_id}/edit`                      | PUT    | Edit a specific interview question               | Body: `{ "new_question": "..." }`                                                          | Yes           | ADMIN only          |
| `/interview-questions/{cv_id}/questions/regenerate`            | POST   | Regenerate interview questions for a CV          | Path: `cv_id`                                                                              | Yes           | ADMIN only          |

4. If you want to test APIs, run the test files in [Test Recruitment]("https://gitlab.endava.com/cuong.quang.nguyen/soai/-/tree/main/backend/services/recruitment_agent/tests?ref_type=heads") (Updating)
```
$ make test-recruitment
```

## Pushing the docker image to registry and release helm chart (Updating)
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
3. Change the docker registry properly via env variable `DOCKER_REGISTRY`.
```bash
$ export DOCKER_REGISTRY=<your-docker-registry>
```
4. Create drop version.
```bash
$ make clean init image push
```
This will sent and push the drop version to docker registry. Helm will manage to push to registry also.
5. Create tag version after release the drop tag version of docker images and helm chart.
```bash
$ make git-tag
```
This will create the git tag and push to git.
## Deploy helm chart to k8s cluster
### Prepare
```bash
$ make package-helm
```
The helm build will locate at `build/helm-build/soai-application/` folder
You can preview the helm chart by
```bash
$ helm template soai-app build/helm-build/soai-application/soai-application/
```
```bash
$ helm -n <namespace> install soai-app build/helm-build/soai-application/soai-application-<version>.tgz --set <values> --debug --create-namespace
```
This will install SOAI helm chart to k8s cluster.
The TLS certificate was used by `cert-manager` you can install it in `test/athena_chart`.
```bash
$ ./deploy.sh -n monitoring
```
You can install the cert-manager, prometheus, grafana to monitor and create `cert-manaager` CRDs in order to deploy TLS certificates in SOAI-application.
### License
This repository is proprietary and confidential. Usage is subject to internal policies. Contact maintainers for access or usage rights.