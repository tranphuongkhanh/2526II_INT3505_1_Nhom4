# Stage 1: Build the backend with Maven
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy the maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (this step will be cached unless pom.xml changes)
# Convert line endings of mvnw to unix just in case
RUN sed -i 's/\r$//' mvnw
RUN ./mvnw dependency:go-offline -B

# Copy the source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
