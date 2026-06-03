# Rental Management System — INT3505 Group 4

A full-stack property rental management platform built with **Spring Boot** (backend) and **React + Vite** (frontend).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Running with Docker](#running-with-docker)
- [Monitoring Stack](#monitoring-stack)
- [API Testing](#api-testing)
- [Project Structure](#project-structure)

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Java 21, Spring Boot 3.5, Spring Security, JWT   |
| Database   | PostgreSQL (Neon), Redis (cache & rate-limiting)  |
| Frontend   | React 19, Vite, Tailwind CSS, React Router v7     |
| Payments   | VNPay sandbox                                     |
| Storage    | Cloudinary                                        |
| Monitoring | Prometheus, Grafana, Loki, Promtail               |

---

## Prerequisites

| Tool          | Version   | Notes                                      |
|---------------|-----------|--------------------------------------------|
| JDK           | 21+       | Maven Wrapper is bundled — no Maven needed |
| Node.js       | 18+       | npm is included                            |
| Redis         | any       | Must be running locally on port `6379`     |
| Docker        | any       | Only needed for the monitoring stack       |

---

## Environment Variables

### Backend (`backend/.env`)

Create the file `backend/.env` with the following content:

```properties
# PostgreSQL
DB_HOST=<your-neon-host>
DB_PORT=5432
DB_NAME=neondb
DB_USERNAME=<db-username>
DB_PASSWORD=<db-password>
DB_SSLMODE=require
DB_CHANNEL_BINDING=require

# JWT
JWT_SECRET=<at-least-64-char-random-string>

# Email (Gmail SMTP)
MAIL_USERNAME=<your-gmail>
MAIL_PASSWORD=<gmail-app-password>

# Redis (optional — defaults to localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# VNPay (sandbox defaults are pre-filled in application.properties)
# VNPAY_TMN_CODE=
# VNPAY_HASH_SECRET=

# Cloudinary (defaults are pre-filled in application.properties)
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
```

### Frontend (`frontend/.env`)

Create `frontend/.env` if you need to override the backend URL:

```properties
VITE_API_BASE_URL=http://localhost:8080
```

---

## Running Locally

### Backend

```bash
cd backend

# Linux / macOS
./mvnw spring-boot:run

# Windows PowerShell
.\mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

To run tests:

```bash
./mvnw test
```

To build a JAR:

```bash
./mvnw clean package -DskipTests
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

To build for production:

```bash
npm run build
```

---

## Running with Docker

Build and run the backend container:

```bash
cd backend
docker build -t rental-backend .
docker run -p 8080:8080 --env-file .env rental-backend
```

> Make sure Redis is accessible from inside the container. If Redis is running on your host, set `REDIS_HOST=host.docker.internal` in your `.env`.

---

## Monitoring Stack

The monitoring stack includes **Prometheus**, **Grafana**, **Loki**, and **Promtail**.

```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

| Service    | URL                    | Default credentials |
|------------|------------------------|---------------------|
| Grafana    | http://localhost:3000  | admin / admin       |
| Prometheus | http://localhost:9090  | —                   |
| Loki       | http://localhost:3100  | —                   |

Metrics are exposed by the backend at `http://localhost:8080/actuator/prometheus`.

---

## API Testing

A full Postman collection is included at `backend/postman_full_collection.json`.

1. Open Postman and click **Import**.
2. Select `backend/postman_full_collection.json`.
3. The collection uses `{{baseUrl}}` (default `http://localhost:8080`) and `{{token}}` (auto-saved on login).
4. Run **Register** → **Login** → use any other endpoint. The login request's test script saves the JWT to `{{token}}` automatically.

A Swagger/OpenAPI spec is available at `swagger.yaml` in the project root.

---

## Project Structure

```
.
├── backend/                  # Spring Boot application
│   ├── src/
│   │   └── main/
│   │       ├── java/com/example/Rental/
│   │       │   ├── config/
│   │       │   ├── controller/
│   │       │   ├── dto/
│   │       │   ├── entity/
│   │       │   ├── repository/
│   │       │   ├── service/
│   │       │   └── RentalApplication.java
│   │       └── resources/
│   │           └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                 # React + Vite application
│   ├── src/
│   └── package.json
├── monitoring/               # Grafana observability stack
│   ├── docker-compose.monitoring.yml
│   ├── prometheus/
│   ├── loki/
│   ├── promtail/
│   └── grafana/
├── k8s/                      # Kubernetes manifests
├── docs/                     # Additional documentation
└── swagger.yaml              # OpenAPI specification
```
