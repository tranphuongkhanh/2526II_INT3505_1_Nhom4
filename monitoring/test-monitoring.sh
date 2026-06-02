#!/usr/bin/env bash

# ──────────────────────────────────────────────────────────────────────────────
# Rental App Monitoring Traffic Generator & Test Script
# This script sends HTTP requests to various endpoints of the backend to populate
# Grafana dashboards with metrics (success, rate limits, errors) and Loki logs.
# ──────────────────────────────────────────────────────────────────────────────

BACKEND_URL="http://localhost:8080"
MONITORING_URL="http://localhost:3000"

echo "======================================================================"
echo "🚀 Rental App Observability Test Script"
echo "======================================================================"

# Check if backend is running
if [ "$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/v1/public/statistics")" != "200" ]; then
    echo "❌ Error: Spring Boot backend is not running at ${BACKEND_URL}."
    echo "Please start the backend first (e.g. ./mvnw spring-boot:run) and re-run."
    exit 1
fi

echo "✅ Spring Boot backend is UP!"

# Check if Grafana is running
if ! curl -s --head --request GET "${MONITORING_URL}/api/health" | grep "200" > /dev/null; then
    echo "⚠️  Warning: Grafana does not seem to be running at ${MONITORING_URL}."
    echo "Make sure to start the monitoring stack using:"
    echo "   cd monitoring/ && docker compose -f docker-compose.monitoring.yml up -d"
fi

echo -e "\n----------------------------------------------------------------------"
echo "1️⃣ Generating Standard HTTP & Database traffic (Populating metrics & graphs)..."
echo "----------------------------------------------------------------------"
for i in {1..15}; do
    echo -n "."
    curl -s -o /dev/null "${BACKEND_URL}/api/v1/public/statistics"
    curl -s -o /dev/null "${BACKEND_URL}/api/v1/posts?page=0&size=10"
    sleep 0.1
done
echo -e "\nSent 30 successful requests (leased connections from Hikari DB pool)."

echo -e "\n----------------------------------------------------------------------"
echo "2️⃣ Triggering Warnings and Errors (Populating Loki & error panels)..."
echo "----------------------------------------------------------------------"
# Sending a login request with bad credentials to cause a RuntimeException in AuthService
echo "Sending login requests with invalid credentials to trigger errors..."
for i in {1..3}; do
    curl -s -X POST "${BACKEND_URL}/api/v1/auth/login" \
         -H "Content-Type: application/json" \
         -d '{"email": "wrong-user@nonexistent.com", "password": "wrongpassword"}' \
         -o /dev/null
    sleep 0.2
done
echo "Errors generated. (Check 'Error & Warning Logs' panel in Grafana)."

echo -e "\n----------------------------------------------------------------------"
echo "3️⃣ Triggering Rate Limiting (HTTP 429 Blocked)..."
echo "----------------------------------------------------------------------"
echo "Sending rapid requests to auth endpoint (limit is 10/min) to trigger 429..."
for i in {1..12}; do
    # This will exceed the 10 requests/min threshold
    res=$(curl -s -w "%{http_code}" -o /dev/null -X POST "${BACKEND_URL}/api/v1/auth/login" \
         -H "Content-Type: application/json" \
         -d '{"email": "test@rental.com", "password": "password"}')
    if [ "$res" = "429" ]; then
        echo -n "🛑[429 Blocked!] "
    else
        echo -n "✓[$res] "
    fi
    sleep 0.05
done
echo -e "\nRate limit triggered! (Check the 'Blocked Requests' and HTTP Status graphs)."

echo -e "\n======================================================================"
echo "📊 Done generating traffic!"
echo "Open Grafana: http://localhost:3000 (username: admin / password: admin)"
echo "Go to: 'Rental App — Overview' dashboard to see live metrics and logs."
echo "======================================================================"
