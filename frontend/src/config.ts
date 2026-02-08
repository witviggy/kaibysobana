/**
 * Centralized configuration module.
 * Reads from environment variables with sensible defaults for development.
 * 
 * NOTE: All environment variables must differ between build and runtime if not using
 * the VITE_ prefix for static replacement.
 * But since this is a Vite app, we use import.meta.env.
 */

interface Config {
    API_URL: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT_ID: string;
}

const config: Config = {
    // API URL - defaults to localhost in dev, but should be set in .env
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

    // Keycloak Configuration
    KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM || 'kai',
    KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'kai-frontend',
};

export default config;
