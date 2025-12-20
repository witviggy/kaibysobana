FROM quay.io/keycloak/keycloak:23.0

USER root

# Install curl
RUN microdnf install -y curl && \
    microdnf clean all

WORKDIR /opt/keycloak/data

# Copy realm config and entrypoint
COPY realm-config.json /opt/keycloak/data/import/
COPY keycloak-entrypoint.sh /opt/keycloak/data/keycloak-entrypoint.sh

# Make sure the script is executable
RUN chmod +x /opt/keycloak/data/keycloak-entrypoint.sh

USER keycloak

ENTRYPOINT ["sh", "/opt/keycloak/data/keycloak-entrypoint.sh"]
