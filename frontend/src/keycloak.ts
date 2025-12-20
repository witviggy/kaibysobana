import Keycloak from 'keycloak-js';

// Keycloak configuration
// These values will be configured after Keycloak realm/client is set up
const keycloakConfig = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'https://kaibysobana-keycloak.purpleisland-0b71ed79.centralindia.azurecontainerapps.io',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'kai',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'kai-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
