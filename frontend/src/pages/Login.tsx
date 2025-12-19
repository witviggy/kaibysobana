import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check for error params
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');

    useEffect(() => {
        if (user && !loading) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-8 w-full max-w-md text-center">
                <div className="mb-8 flex justify-center">
                    <img
                        src="/src/logo/kailogov1.png"
                        alt="கை(kai)"
                        className="w-16 h-16 rounded-xl object-contain"
                    />
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome Back</h1>
                <p className="text-zinc-500 mb-8">Sign in to கை(kai) Dashboard</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 border border-red-200">
                        Authentication failed. Please try again.
                    </div>
                )}

                <button
                    onClick={login}
                    className="w-full py-3 px-4 bg-zinc-900 text-white rounded-lg font-medium hover:bg-black transition-colors flex items-center justify-center gap-3 shadow-sm"
                >
                    <LogIn size={20} />
                    Sign in
                </button>
            </div>
            <p className="mt-8 text-xs text-zinc-400">© 2025 கை(kai). All rights reserved.</p>
        </div>
    );
};

export default Login;
