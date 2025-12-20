FROM quay.io/keycloak/keycloak:23.0

# Use a writable directory for custom scripts
WORKDIR /tmp

# Copy realm config
COPY realm-config.json /tmp/realm-config.json

# Copy entrypoint script
COPY keycloak-entrypoint.sh /tmp/keycloak-entrypoint.sh
RUN chmod +x /tmp/keycloak-entrypoint.sh

# Start the container with custom entrypoint
ENTRYPOINT ["/tmp/keycloak-entrypoint.sh"]
