#!/bin/sh
# Fully hard-coded Keycloak startup script

# Start Keycloak in dev mode
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to start..."
until curl -s -k https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io/realms/master; do
  sleep 5
done

/opt/keycloak/bin/kc.sh config credentials \
  --server https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io \
  --realm master \
  --user admin \
  --password admin

# Create client (ignore if exists)
/opt/keycloak/bin/kc.sh create clients -r kai \
  -s clientId=kai-frontend \
  -s publicClient=true \
  -s directAccessGrantsEnabled=true || true

# Update Web Origins & Redirect URIs
/opt/keycloak/bin/kc.sh update clients/kai-frontend -r kai \
  -s webOrigins="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io\"]" \
  -s redirectUris="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io/*\"]"

echo "Keycloak client configured for frontend: https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io"

# Keep container running
wait
