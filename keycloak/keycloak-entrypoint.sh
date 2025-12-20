#!/bin/sh
# Fully hard-coded Keycloak startup script

# Start Keycloak in dev mode with realm import
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to start..."
until curl -s -k https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io/realms/master; do
  sleep 5
done

# Set credentials
/opt/keycloak/bin/kc.sh config credentials \
  --server https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io \
  --realm master \
  --user admin \
  --password admin

# Create client (ignore if exists)
CLIENT_ID=kai-frontend
REALM=kai

/opt/keycloak/bin/kc.sh create clients -r $REALM \
  -s clientId=$CLIENT_ID \
  -s publicClient=true \
  -s directAccessGrantsEnabled=true || true

# Update Web Origins & Redirect URIs for CORS / iframe
/opt/keycloak/bin/kc.sh update clients/$CLIENT_ID -r $REALM \
  -s webOrigins="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io\"]" \
  -s redirectUris="[\"https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io/*\"]"

echo "Keycloak client configured for frontend."

# Keep container running
wait
