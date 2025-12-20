#!/bin/sh
# Fully hard-coded Keycloak startup script

# Start Keycloak in dev mode
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to start..."
until curl -s -k https://${KC_HOSTNAME}/realms/master; do
  sleep 5
done

# Hard-coded client configuration
CLIENT_ID=kai-frontend
REALM=kai
FRONTEND_URL=${KC_FRONTEND_URL}
KEYCLOAK_HOSTNAME=${KC_HOSTNAME}

# Set admin credentials
ADMIN_USER=${KEYCLOAK_ADMIN}
ADMIN_PASS=${KEYCLOAK_ADMIN_PASSWORD}

/opt/keycloak/bin/kc.sh config credentials \
  --server https://$KEYCLOAK_HOSTNAME \
  --realm master \
  --user $ADMIN_USER \
  --password $ADMIN_PASS

# Create client (ignore if exists)
/opt/keycloak/bin/kc.sh create clients -r $REALM \
  -s clientId=$CLIENT_ID \
  -s publicClient=true \
  -s directAccessGrantsEnabled=true || true

# Update Web Origins & Redirect URIs
/opt/keycloak/bin/kc.sh update clients/$CLIENT_ID -r $REALM \
  -s webOrigins="[\"$FRONTEND_URL\"]" \
  -s redirectUris="[\"$FRONTEND_URL/*\"]"

echo "Keycloak client configured for frontend: $FRONTEND_URL"

# Keep container running
wait
