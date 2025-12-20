#!/bin/sh
set -e

echo "Starting Keycloak..."

# Start Keycloak
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait until Keycloak is ready (internal HTTP)
until curl -sf http://localhost:8080/realms/master; do
  echo "Waiting for Keycloak..."
  sleep 5
done

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
