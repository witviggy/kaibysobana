FROM quay.io/keycloak/keycloak:23.0

WORKDIR /opt/keycloak

# Copy realm config
COPY realm-config.json /opt/keycloak/data/import/

# Copy entrypoint script
COPY keycloak-entrypoint.sh /opt/keycloak/keycloak-entrypoint.sh
RUN chmod +x /opt/keycloak/keycloak-entrypoint.sh

# Hard-coded environment variables
# ENV KC_PROXY=edge
# ENV KC_HOSTNAME=kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io
# ENV KC_HOSTNAME_URL=https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io
# ENV KC_HOSTNAME_STRICT_HTTPS=true

# ENV KEYCLOAK_ADMIN=admin
# ENV KEYCLOAK_ADMIN_PASSWORD=admin

# ENV KC_DB=postgres
# ENV KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak?sslmode=require
# ENV KC_DB_USERNAME=postgres
# ENV KC_DB_PASSWORD=password

# Frontend URL for CORS / iframe
# ENV KC_FRONTEND_URL=https://kaibysobana-frontend.purpleisland-0b71ed79.centralindia.azurecontainerapps.io

ENTRYPOINT ["/opt/keycloak/keycloak-entrypoint.sh"]
