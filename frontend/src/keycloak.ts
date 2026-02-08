import Keycloak from 'keycloak-js';
import config from './config';

// Keycloak configuration
// These values will be configured after Keycloak realm/client is set up
const keycloakConfig = {
    url: config.KEYCLOAK_URL,
    realm: config.KEYCLOAK_REALM,
    clientId: config.KEYCLOAK_CLIENT_ID,
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
