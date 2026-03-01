import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const initCalled = useRef(false);

    // Check for existing token on mount
    useEffect(() => {
        const initAuth = async () => {
            if (initCalled.current) return;
            initCalled.current = true;

            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    console.log('🔐 Found existing token, verifying...');
                    const userData = await api.getCurrentUser();
                    console.log('✅ User verified:', userData?.email);
                    setUser(userData);
                } catch (err) {
                    console.log('❌ Token invalid, clearing...');
                    localStorage.removeItem('auth_token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const fetchUserData = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch (err) {
            console.error('❌ Failed to fetch user data:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = useCallback(async () => {
        setLoading(true);
        await fetchUserData();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setAuthError(null);
        try {
            const response = await api.login(email, password);
            localStorage.setItem('auth_token', response.token);
            setUser(response.user);
        } catch (err: any) {
            const message = err.message || 'Login failed';
            setAuthError(message);
            throw err;
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        setAuthError(null);
        try {
            const response = await api.register(name, email, password);
            localStorage.setItem('auth_token', response.token);
            setUser(response.user);
        } catch (err: any) {
            const message = err.message || 'Registration failed';
            setAuthError(message);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
        setAuthError(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, authError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
