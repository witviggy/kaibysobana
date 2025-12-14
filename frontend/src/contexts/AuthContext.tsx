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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = () => {
        // Redirect to Backend Google Auth Endpoint
        window.location.href = 'http://localhost:5000/auth/google';
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
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
