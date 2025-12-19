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
            // Debug: Log full URL and search params
            console.log('🔍 AuthCallback: Full URL:', window.location.href);
            console.log('🔍 AuthCallback: Search params:', window.location.search);

            const token = searchParams.get('token');
            console.log('🔍 AuthCallback: Token extracted:', token ? `${token.substring(0, 20)}...` : 'NULL');

            if (token) {
                // Store token in localStorage
                localStorage.setItem('auth_token', token);
                console.log('✅ Token stored in localStorage');

                // Verify it was stored
                const storedToken = localStorage.getItem('auth_token');
                console.log('✅ Verification - Token in localStorage:', storedToken ? 'YES' : 'NO');

                // Refresh user data in AuthContext
                console.log('🔄 Calling refreshUser...');
                await refreshUser();
                console.log('✅ refreshUser completed');

                // Redirect to home page
                console.log('➡️ Navigating to /');
                navigate('/', { replace: true });
            } else {
                // No token, redirect to login with error
                console.error('❌ No token in callback URL');
                console.error('❌ Full URL was:', window.location.href);
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
