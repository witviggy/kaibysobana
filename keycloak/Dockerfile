# Stage 1: get wget
FROM busybox:1.36 AS tools

# Stage 2: keycloak
FROM quay.io/keycloak/keycloak:23.0

USER root

# Copy wget into the image
COPY --from=tools /bin/wget /usr/bin/wget

WORKDIR /opt/keycloak/data

COPY realm-config.json /opt/keycloak/data/import/
COPY keycloak-entrypoint.sh /opt/keycloak/data/keycloak-entrypoint.sh

RUN chmod +x /opt/keycloak/data/keycloak-entrypoint.sh

USER keycloak

ENTRYPOINT ["sh", "/opt/keycloak/data/keycloak-entrypoint.sh"]
