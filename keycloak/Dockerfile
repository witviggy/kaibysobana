FROM quay.io/keycloak/keycloak:23.0

USER root
EXPOSE 8080

WORKDIR /opt/keycloak/data

COPY realm-config.json /opt/keycloak/data/import/
COPY keycloak-entrypoint.sh /opt/keycloak/data/keycloak-entrypoint.sh

RUN chmod +x /opt/keycloak/data/keycloak-entrypoint.sh

USER keycloak

ENTRYPOINT ["sh", "/opt/keycloak/data/keycloak-entrypoint.sh"]