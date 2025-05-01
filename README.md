# SOAI Project Developing Multiple AI-AGENT.

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
1. If you want to developing the recruitment AI Agent locally. Install python version >= 3.11. Create venv
```bash
$ python3 -m venv venv
$ source venv/bin/activate
$ pip install -r backend/services/recruitment_agent/requirements.txt
```
2. You need to run before start the recruitment agent
```bash
$ docker compose up authentication -d
```
Or even if you don't need to run the application locally, just run
```bash
docker compose up recruitment -d
```
This will install dependencies and recruitment docker container start for you. This will run authentication for JWT verification and MySQL database for storing datas.

3. Run the application
```bash
$ python3 backend/services/recruitment_agent/app/main.py
```
The repository used `sqlachemy` to automate create tables and structure all SQL database for you. So don't need to create tables manually. Check the database is created with
```bash
$ docker exec -it soai_mysql mysql -usoai_user -psoai_password;
$ use soai_db;
$ show tables;
```
4. Recruitment API Endpoint Summary

| Endpoint                | Method | Description                                | Request Parameters / Body                                                                 | Auth Required | Role Access        |
|-------------------------|--------|--------------------------------------------|--------------------------------------------------------------------------------------------|----------------|---------------------|
| `/upload-cv`            | POST   | Upload and parse candidate CV              | FormData: `file`, `override_email` (optional), `position_applied_for`                      | Yes            | All authenticated   |
| `/upload-jd`            | POST   | Upload job descriptions                    | File upload (JSON format)                                                                  | Yes            | All authenticated   |
| `/approve-cv`           | POST   | Approve a candidate’s CV                   | FormData: `candidate_id`                                                                   | Yes            | DEV, QA, ADMIN      |
| `/pending-cv-list`      | GET    | Get list of CVs with `PENDING` status      | Query: `candidate_name` (optional)                                                         | Yes            | All authenticated   |
| `/schedule-interview`   | POST   | Schedule an interview for a candidate      | JSON Body: `InterviewScheduleCreateSchema`                                                 | Yes            | All authenticated   |
| `/accept-interview`     | PUT    | Candidate accepts a scheduled interview    | JSON Body: `InterviewAcceptSchema`                                                         | Yes            | All authenticated   |
| `/interview-list`       | GET    | Get list of interviews (optional filters)  | Query: `interview_date`, `candidate_name` (optional)                                       | Yes            | All authenticated   |
| `/jd-list`              | GET    | Get list of job descriptions               | Query: `position` (optional)                                                               | Yes            | All authenticated   |
5. If you want to test APIs, run the test files in [Test Recruitment]("https://gitlab.endava.com/cuong.quang.nguyen/soai/-/tree/main/backend/services/recruitment_agent/tests?ref_type=heads") (Updating)
```
$ python3 backend/services/recruitment_agent/tests/test_api_recruitment.py
```

### License
This repository is proprietary and confidential. Usage is subject to internal policies. Contact maintainers for access or usage rights.