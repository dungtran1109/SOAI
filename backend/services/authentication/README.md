# Documentation Authentication Java-Spring Boot API
---
<a href = "#Prerequisites">Prerequisites</a>
---
- Technical:
    - Docker MySQL database installed in Docker Container
    - Set up account for using database: messager/messager
    - Spring Boot
    - Spring Security
    - JWT
    - Java environment (Java ver 17)
- Build: Maven 3.9.1
- Hibernate Core ORM: Hibernate

# How to make an API Requests from terminal (CURL Command)
---
<a>Prerequisites</a>
---
- Environment:
    - Linux
    - Curl
- Command going to use to make a test API
```
curl [options] [URL...]
```
- HTTP GET
    - The GET method requests a specific resource from the localhost:9090 server
    - GET is the default method when making HTTP requests with <strong>curl</strong>
```
$ curl http://localhost:9090/api/accounts -H "Authorization: Bearer <ACCESS_TOKEN>"
```
To filter result use query params:
```
$ curl http://localhost:9090/api/accounts?acc_id=1 -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- HTTP POST
    - The POST method is used to create a resource on the server (localhost:9090). If the resource exists, it is overridden
    - The following command make <strong>POST request</strong> using the data specified with the ```-d ``` option:
```
$ curl -X POST http://localhost:9090/api/accounts/signup -H "Content-Type: application/json" -d '{"userName": "anhdung", "password": "anhdung"}'
```
- This command will return the response from the server that you made request. In this circumstances, the response we are going to get is a token <ACCESS_TOKEN>
- Using this token detached in Header for each request --> Authenticate each Filter request when making API call to inner Application
- HTTP PUT:
    - The PUT method is used to update or replace a resource on a server. It replaces all data of the specified resource with the request data.
```
$ curl -X PUT http://localhost:9090/api/users/1 -H "Content-Type: application/json" -d '{"address":"address1", "gender": "MALE"}' -H "Authorization: Bearer <ACCESS_TOKEN>"
```
- HTTP DELETE:
    - The DELETE method is used ti removes the specified resource from the server
```
$ curl -X DELETE http://localhost:90908/api/user/1
```

<a><strong>API Requests</strong></a>

## User APIs
| Path               | Method |
|--------------------|--------|
| `/api/v1/authentications/users`      | GET    |
| `/api/v1/authentications/users/:id`  | GET    |
| `/api/v1/authentications/users/search` | GET  |
| `/api/v1/authentications/users/find`   | GET  |
| `/api/v1/authentications/users`      | POST   |
| `/api/v1/authentications/users/:id`  | PATCH  |
| `/api/v1/authentications/users/:id`  | DELETE |

## Account APIs
| Path                   | Method |
|------------------------|--------|
| `/api/v1/authentications/signin`  | POST   |
| `/api/v1/authentications/signup`  | POST   |
| `/api/v1/authentications/accounts`        | GET    |
| `/api/v1/authentications/account/:id`     | GET    |
| `/api/v1/authentications/account/:userName` | GET  |
| `/api/v1/authentications/accounts/:id`    | PUT    |
| `/api/v1/authentications/accounts/:id`    | DELETE |

## Swagger docs
All the API docs visible in
</l>http://localhost:9090/swagger-ui/index.html#/</l>

## Health Check
To check whether the application is healthy or not, using Actuator dependency to monitor and check the application health.
</l>http://localhost:9090/actuator/health</l>
