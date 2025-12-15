import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    google_id?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        // Check if token exists in localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        setLoading(true);
        await checkAuth();
    };

    const login = () => {
        // Redirect to Backend Google Auth Endpoint
        // Auth routes are at /auth/google, not /api/auth/google
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove /api suffix if present
        window.location.href = `${baseUrl}/auth/google`;
    };

    const logout = async () => {
        try {
            await api.logout();
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
