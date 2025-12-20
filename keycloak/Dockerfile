FROM quay.io/keycloak/keycloak:23.0

WORKDIR /opt/keycloak/data

# Copy realm config and entrypoint
COPY realm-config.json /opt/keycloak/data/import/
COPY keycloak-entrypoint.sh /opt/keycloak/data/keycloak-entrypoint.sh

# Run the script directly with sh
ENTRYPOINT ["sh", "/opt/keycloak/data/keycloak-entrypoint.sh"]
