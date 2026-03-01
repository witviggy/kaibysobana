/**
 * Centralized configuration module.
 * Reads from environment variables with sensible defaults for development.
 */

interface Config {
    API_URL: string;
}

const config: Config = {
    // API URL - defaults to localhost in dev, but should be set in .env
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

export default config;
