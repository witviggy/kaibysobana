import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import keycloak from '../keycloak';
import { api } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
    avatar_url?: string;
    keycloak_id?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    keycloakToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [keycloakToken, setKeycloakToken] = useState<string | null>(null);
    const [keycloakInitialized, setKeycloakInitialized] = useState(false);
    const initCalled = useRef(false); // Prevent double init in React Strict Mode

    // Initialize Keycloak
    useEffect(() => {
        const initKeycloak = async () => {
            // Prevent double initialization (React Strict Mode)
            if (initCalled.current) return;
            initCalled.current = true;

            try {
                console.log('🔐 Initializing Keycloak...');
                const authenticated = await keycloak.init({
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                    checkLoginIframe: false,
                    pkceMethod: 'S256', // Enable PKCE
                });

                console.log('🔐 Keycloak initialized, authenticated:', authenticated);
                setKeycloakInitialized(true);

                if (authenticated && keycloak.token) {
                    console.log('✅ User authenticated via Keycloak');
                    setKeycloakToken(keycloak.token);
                    localStorage.setItem('auth_token', keycloak.token);

                    // Fetch user data from backend
                    await fetchUserData();
                } else {
                    console.log('❌ User not authenticated');
                    setUser(null);
                    setLoading(false);
                }

                // Set up token refresh
                keycloak.onTokenExpired = () => {
                    console.log('🔄 Token expired, refreshing...');
                    keycloak.updateToken(30).then((refreshed) => {
                        if (refreshed && keycloak.token) {
                            console.log('✅ Token refreshed');
                            setKeycloakToken(keycloak.token);
                            localStorage.setItem('auth_token', keycloak.token);
                        }
                    }).catch(() => {
                        console.error('❌ Failed to refresh token');
                        logout();
                    });
                };

            } catch (error) {
                console.error('❌ Keycloak init error:', error);
                setLoading(false);
            }
        };

        initKeycloak();
    }, []);

    const fetchUserData = async () => {
        try {
            console.log('📡 Fetching user data...');
            const userData = await api.getCurrentUser();
            console.log('✅ User data received:', userData?.email);
            setUser(userData);
        } catch (err) {
            console.error('❌ Failed to fetch user data:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = useCallback(async () => {
        console.log('🔄 Refreshing user...');
        setLoading(true);
        await fetchUserData();
    }, []);

    const login = useCallback(() => {
        console.log('🔐 Redirecting to Keycloak login...');
        keycloak.login({
            redirectUri: window.location.origin + '/',
        });
    }, []);

    const logout = useCallback(async () => {
        console.log('🔐 Logging out...');
        try {
            localStorage.removeItem('auth_token');
            setUser(null);
            setKeycloakToken(null);

            if (keycloakInitialized) {
                await keycloak.logout({
                    redirectUri: window.location.origin + '/login',
                });
            }
        } catch (err) {
            console.error('❌ Logout error:', err);
        }
    }, [keycloakInitialized]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, keycloakToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
