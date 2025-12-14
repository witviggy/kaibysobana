import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';

const App: React.FC = () => {
    return (
        <ToastProvider>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/*" element={<Layout />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </ToastProvider>
    );
};

export default App;
