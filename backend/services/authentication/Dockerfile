# Use official Maven image to build the application
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

ARG USER_ID=1001
COPY --chmod=0755 --chown=${USER_ID}:0 pom.xml ./
RUN mvn dependency:go-offline

COPY --chmod=0755 --chown=${USER_ID}:0 src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend Authentication Service" \
    soai.image.created="$BUILD_TIME"

WORKDIR /app
COPY --chmod=0755 --chown=${USER_ID}:0 --from=builder /app/target/*.jar app.jar
EXPOSE 9090

USER ${USER_ID}

CMD ["java", "-jar", "app.jar"]