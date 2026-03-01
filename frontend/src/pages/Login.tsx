import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
    const { login, register, user, loading, authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchParams = new URLSearchParams(location.search);
    const urlError = searchParams.get('error');

    useEffect(() => {
        if (user && !loading) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (isRegisterMode) {
                if (!name.trim()) {
                    setError('Name is required');
                    setSubmitting(false);
                    return;
                }
                await register(name, email, password);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
            }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#18181b' }} />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            padding: '24px',
        }}>
            {/* Subtle background pattern */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(24, 24, 27, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(24, 24, 27, 0.02) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(24, 24, 27, 0.015) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
                animation: 'loginSlideUp 0.5s ease-out',
            }}>
                {/* Logo & Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        marginBottom: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #e4e4e7',
                    }}>
                        <img
                            src="/src/logo/kailogov1.png"
                            alt="கை(kai)"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#18181b',
                        margin: '0 0 6px 0',
                        letterSpacing: '-0.02em',
                    }}>
                        {isRegisterMode ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <p style={{
                        fontSize: '14px',
                        color: '#71717a',
                        margin: 0,
                    }}>
                        {isRegisterMode
                            ? 'Get started with கை(kai)'
                            : 'Sign in to your கை(kai) dashboard'
                        }
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)',
                    padding: '28px',
                }}>
                    {/* Error Alert */}
                    {(error || urlError) && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            animation: 'loginShake 0.4s ease-out',
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#dc2626',
                                flexShrink: 0,
                            }} />
                            {error || 'Authentication failed. Please try again.'}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name field (register only) */}
                        {isRegisterMode && (
                            <div style={{ marginBottom: '16px' }}>
                                <label htmlFor="name" style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#3f3f46',
                                    marginBottom: '6px',
                                }}>
                                    Full name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#a1a1aa',
                                        pointerEvents: 'none',
                                    }} />
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 36px',
                                            border: '1px solid #e4e4e7',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#18181b',
                                            background: '#fafafa',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#a1a1aa';
                                            e.target.style.background = '#ffffff';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(24, 24, 27, 0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e4e4e7';
                                            e.target.style.background = '#fafafa';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="email" style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#3f3f46',
                                marginBottom: '6px',
                            }}>
                                Email address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#a1a1aa',
                                    pointerEvents: 'none',
                                }} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 36px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#18181b',
                                        background: '#fafafa',
                                        outline: 'none',
                                        transition: 'all 0.15s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#a1a1aa';
                                        e.target.style.background = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(24, 24, 27, 0.05)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e4e4e7';
                                        e.target.style.background = '#fafafa';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label htmlFor="password" style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#3f3f46',
                                marginBottom: '6px',
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#a1a1aa',
                                    pointerEvents: 'none',
                                }} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isRegisterMode ? 'Minimum 6 characters' : '••••••••'}
                                    required
                                    minLength={isRegisterMode ? 6 : undefined}
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 36px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#18181b',
                                        background: '#fafafa',
                                        outline: 'none',
                                        transition: 'all 0.15s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#a1a1aa';
                                        e.target.style.background = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(24, 24, 27, 0.05)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e4e4e7';
                                        e.target.style.background = '#fafafa';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#a1a1aa',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#52525b')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '11px 16px',
                                background: submitting ? '#3f3f46' : '#18181b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.15s ease',
                                opacity: submitting ? 0.7 : 1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#09090b'; }}
                            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#18181b'; }}
                        >
                            {submitting ? (
                                <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : isRegisterMode ? (
                                <UserPlus size={17} />
                            ) : (
                                <LogIn size={17} />
                            )}
                            {submitting
                                ? (isRegisterMode ? 'Creating account...' : 'Signing in...')
                                : (isRegisterMode ? 'Create account' : 'Sign in')
                            }
                        </button>
                    </form>
                </div>

                {/* Toggle link */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '20px',
                }}>
                    <button
                        onClick={() => {
                            setIsRegisterMode(!isRegisterMode);
                            setError(null);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '13px',
                            color: '#71717a',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#18181b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                    >
                        {isRegisterMode
                            ? <>Already have an account? <span style={{ fontWeight: 600 }}>Sign in</span></>
                            : <>Don&apos;t have an account? <span style={{ fontWeight: 600 }}>Sign up</span></>
                        }
                    </button>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#a1a1aa',
                    marginTop: '32px',
                }}>
                    © 2025 கை(kai). All rights reserved.
                </p>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes loginSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes loginShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-4px); }
                    40% { transform: translateX(4px); }
                    60% { transform: translateX(-2px); }
                    80% { transform: translateX(2px); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                input::placeholder {
                    color: #a1a1aa;
                }
            `}</style>
        </div>
    );
};

export default Login;
