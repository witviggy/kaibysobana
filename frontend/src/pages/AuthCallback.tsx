import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AuthCallback - Handles the OAuth callback with JWT token
 * Extracts token from URL, stores in localStorage, and redirects to home
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');

            if (token) {
                // Store token in localStorage
                localStorage.setItem('auth_token', token);
                console.log('✅ Token stored, refreshing user...');

                // Refresh user data in AuthContext
                await refreshUser();

                // Redirect to home page
                navigate('/', { replace: true });
            } else {
                // No token, redirect to login with error
                console.error('❌ No token in callback');
                navigate('/login?error=no_token', { replace: true });
            }
        };

        handleCallback();
    }, [searchParams, navigate, refreshUser]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-primary, #0a0a0a)',
            color: 'var(--text-primary, #fff)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
                <p>Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
