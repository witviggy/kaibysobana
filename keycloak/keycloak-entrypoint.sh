#!/bin/sh
set -e

echo "Starting Keycloak..."

# Start Keycloak
/opt/keycloak/bin/kc.sh start \
  --import-realm \
  --proxy=edge \
  --hostname-strict=false \
  --spi-login-cookie-samesite=None \
  --http-enabled=true &


echo "Waiting for Keycloak to be ready..."

# Simple: Wait for port 8080 to be open
until (echo > /dev/tcp/localhost/8080) >/dev/null 2>&1; do
  echo "Waiting for Keycloak (port 8080 open)..."
  sleep 5
done

# Stronger: Wait for /realms/master to return HTTP 200
until printf "GET /realms/master HTTP/1.1\r\nHost: localhost:8080\r\nConnection: close\r\n\r\n" > /dev/tcp/localhost/8080 2>/dev/null && \
      tail -1 < /dev/tcp/localhost/8080 | grep -q "200 OK"; do
  echo "Waiting for Keycloak (/realms/master ready)..."
  sleep 5
done

echo "Keycloak is up. Configuring..."

echo "Keycloak is up. Configuring..."

# Authenticate CLI
/opt/keycloak/bin/kc.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password admin

CLIENT_ID=kai-frontend
REALM=kai

# Create client (idempotent)
/opt/keycloak/bin/kc.sh create clients -r $REALM \
  -s clientId=$CLIENT_ID \
  -s publicClient=true \
  -s standardFlowEnabled=true \
  -s directAccessGrantsEnabled=false || true

# Update frontend config
/opt/keycloak/bin/kc.sh update clients/$CLIENT_ID -r $REALM \
  -s webOrigins="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io\"]" \
  -s redirectUris="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io/*\"]"

echo "Keycloak client configured."

wait
