# Grafana Observability Stack

A **Prometheus + Loki + Promtail + Grafana** monitoring stack for the Rental App backend.

## Architecture

```
Spring Boot (/actuator/prometheus)
        │
        ▼ scrape (every 10s)
   Prometheus  ──────────────────────────┐
                                         │
backend.log                              │  (metrics + logs)
        │                                ▼
        ▼ tail               Grafana (port 3000)
    Promtail
        │
        ▼ push
       Loki
```

## Quick Start

### 1. Start the monitoring stack

```bash
cd monitoring/
docker compose -f docker-compose.monitoring.yml up -d
```

### 2. Restart the Spring Boot backend

The new `pom.xml` dependencies (Actuator + Micrometer) need a rebuild:

```bash
cd backend/
./mvnw spring-boot:run
# or rebuild if running as a JAR
./mvnw clean package -DskipTests && java -jar target/*.jar
```

### 3. Open Grafana

Navigate to [http://localhost:3000](http://localhost:3000)

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `admin` |

The **"Rental App → Rental App — Overview"** dashboard is pre-loaded automatically.

### 4. Verify Prometheus is scraping

Open [http://localhost:9090/targets](http://localhost:9090/targets) — the `spring-boot-rental` target should show **State: UP**.

---

## What's Monitored

### Metrics (Prometheus → Grafana)

| Panel | Metric |
|-------|--------|
| HTTP Requests/min | `http_server_requests_seconds_count` |
| Error Rate (5xx) | filtered by `status=~"5.."` |
| P50/P95/P99 Latency | `http_server_requests_seconds_bucket` |
| JVM Heap / Non-Heap | `jvm_memory_used_bytes` |
| JVM Threads | `jvm_threads_live_threads` |
| HikariCP Pool | `hikaricp_connections_*` |
| Rate Limit Hits | HTTP 429 count from `http_server_requests_seconds_count` |

### Logs (Loki → Grafana)

| Panel | Filter |
|-------|--------|
| All application logs | `{job="rental-backend"}` |
| Errors & Warnings | `\|= "ERROR"` or `\|= "WARN"` |

Log file tailed: `backend/backend.log`

---

## File Structure

```
monitoring/
├── docker-compose.monitoring.yml
├── prometheus/
│   └── prometheus.yml          # scrape config
├── loki/
│   └── loki-config.yml         # Loki storage config
├── promtail/
│   └── promtail-config.yml     # log shipping config
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasources.yml # Prometheus + Loki auto-wired
        └── dashboards/
            ├── dashboards.yml  # dashboard folder config
            └── rental-overview.json  # pre-built dashboard
```

---

## Adding Custom Metrics

In any Spring `@Service` or `@Component`, inject `MeterRegistry`:

```java
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final Counter paymentSuccessCounter;
    private final Counter paymentFailureCounter;

    public PaymentService(MeterRegistry registry) {
        this.paymentSuccessCounter = Counter.builder("payment.success")
                .description("Number of successful payments")
                .register(registry);
        this.paymentFailureCounter = Counter.builder("payment.failure")
                .description("Number of failed payments")
                .register(registry);
    }

    public void recordSuccess() {
        paymentSuccessCounter.increment();
    }
}
```

Then in Grafana add a panel with:
```
rate(payment_success_total[1m])
```

---

## Ports

| Service    | Port |
|------------|------|
| Grafana    | 3000 |
| Prometheus | 9090 |
| Loki       | 3100 |
| Spring Boot| 8080 |
