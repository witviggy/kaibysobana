
import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Wallet, Save, RefreshCw, CheckCircle, Camera, Mail, Briefcase } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonLine, SkeletonCircle } from '../components/Skeleton';

const Settings: React.FC = () => {
    const { addToast } = useToast();
    const { refreshUser } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatarUrl: '',
        nickname: '',
        preferences: {
            dashboard: {
                revenueChart: { show: true, type: 'area' },
                statusPie: { show: true }
            },
            financials: {
                revenueChart: { show: true, type: 'area' },
                expensesPie: { show: true }
            }
        }
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await api.getCurrentUser();
                setUser(data);
                const defaultPrefs = {
                    dashboard: {
                        revenueChart: { show: true, type: 'area' },
                        statusPie: { show: true }
                    },
                    financials: {
                        revenueChart: { show: true, type: 'area' },
                        expensesPie: { show: true }
                    }
                };
                const userPrefs = data.preferences || {};

                setFormData({
                    name: data.name,
                    email: data.email,
                    avatarUrl: data.avatarUrl || '',
                    nickname: data.nickname || '',
                    preferences: {
                        dashboard: { ...defaultPrefs.dashboard, ...(userPrefs.dashboard || {}) },
                        financials: { ...defaultPrefs.financials, ...(userPrefs.financials || {}) }
                    }
                });
            } catch (error) {
                console.error("Failed to fetch user", error);
                addToast("Failed to load user settings", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [addToast]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveSuccess(false);
            const updated = await api.updateCurrentUser(formData);
            setUser(updated);

            // Refresh the global auth context so header/layout sees updated avatar
            await refreshUser();

            setSaveSuccess(true);
            addToast("Settings saved successfully", 'success');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update user", error);
            addToast("Failed to save changes", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Camera },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: Wallet },
    ];

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                <SkeletonLine width="200px" height="32px" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <SkeletonLine width="100%" height="40px" />
                        <SkeletonLine width="100%" height="40px" />
                        <SkeletonLine width="100%" height="40px" />
                    </div>
                    <div className="md:col-span-3 space-y-6">
                        <div className="flex items-center gap-6 p-6 bg-white border border-zinc-200 rounded-lg">
                            <SkeletonCircle size="80px" />
                            <div className="space-y-2">
                                <SkeletonLine width="150px" height="24px" />
                                <SkeletonLine width="100px" height="16px" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 h-[400px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Settings</h1>
                <p className="text-zinc-500 text-sm mt-1">Manage your account preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Sidebar Nav */}
                <div className="space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                    ? 'bg-zinc-100 text-zinc-900'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                    }`}
                            >
                                <Icon size={16} className={isActive ? 'text-zinc-900' : 'text-zinc-400'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">

                    {activeTab === 'profile' && (
                        <>
                            {/* Profile Header */}
                            <div className="flex items-center gap-6 p-6 bg-white border border-zinc-200 rounded-lg shadow-sm">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100">
                                        <img
                                            src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=f4f4f5&color=18181b&bold=true&size=128`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900">{formData.nickname || user?.name}</h2>
                                    <p className="text-sm text-zinc-500">{user?.email}</p>
                                    <div className="mt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-100 px-2 py-0.5 rounded inline-block">
                                        {user?.role || 'Admin'}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Form */}
                            <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 shadow-sm">
                                <h2 className="text-base font-semibold text-zinc-900 mb-6">Personal Information</h2>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Nickname (for Welcome Message)</label>
                                            <input
                                                type="text"
                                                value={formData.nickname}
                                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                                placeholder="e.g. Chief, Boss"
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-700">Avatar</label>
                                        <div className="grid grid-cols-6 gap-4 mb-4">
                                            {[
                                                'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                                                'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                                                'https://api.dicebear.com/7.x/notionists/svg?seed=Lilly',
                                                'https://api.dicebear.com/7.x/micah/svg?seed=Oliver',
                                                'https://api.dicebear.com/7.x/personas/svg?seed=Willow',
                                                'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
                                            ].map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setFormData({ ...formData, avatarUrl: url })}
                                                    className={`aspect-square rounded-full border-2 overflow-hidden hover:scale-105 transition-transform ${formData.avatarUrl === url ? 'border-zinc-900 ring-2 ring-zinc-100' : 'border-transparent hover:border-zinc-300'}`}
                                                >
                                                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full bg-zinc-50" />
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Or paste a custom image URL..."
                                            value={formData.avatarUrl}
                                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                                    {saveSuccess ? (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md text-sm font-medium animate-fade-in">
                                            <CheckCircle size={14} /> Saved
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-900 mb-6">Appearance & Charts</h2>

                            <div className="space-y-6">
                                {/* Dashboard Preferences */}
                                {/* Dashboard Preferences */}
                                <div className="p-5 bg-zinc-50 rounded-lg border border-zinc-100">
                                    <h3 className="text-sm font-medium text-zinc-900 mb-4">Dashboard Analytics</h3>
                                    <div className="space-y-6">
                                        {/* Revenue Chart */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm text-zinc-700 font-medium">Revenue Trends Chart</span>
                                                    <p className="text-xs text-zinc-500">Shows income vs profit over time</p>
                                                </div>
                                                <button
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        preferences: {
                                                            ...formData.preferences,
                                                            dashboard: {
                                                                ...formData.preferences.dashboard,
                                                                revenueChart: {
                                                                    ...formData.preferences.dashboard.revenueChart,
                                                                    show: !formData.preferences.dashboard.revenueChart.show
                                                                }
                                                            }
                                                        }
                                                    })}
                                                    className={`w-11 h-6 flex items-center rounded-full transition-colors ${formData.preferences.dashboard.revenueChart.show ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-200 border-zinc-200'} border`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.preferences.dashboard.revenueChart.show ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {formData.preferences.dashboard.revenueChart.show && (
                                                <div className="flex items-center justify-between pl-4 border-l-2 border-zinc-200">
                                                    <span className="text-sm text-zinc-600">Chart Type</span>
                                                    <select
                                                        value={formData.preferences.dashboard.revenueChart.type}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            preferences: {
                                                                ...formData.preferences,
                                                                dashboard: {
                                                                    ...formData.preferences.dashboard,
                                                                    revenueChart: {
                                                                        ...formData.preferences.dashboard.revenueChart,
                                                                        type: e.target.value as any
                                                                    }
                                                                }
                                                            }
                                                        })}
                                                        className="px-3 py-1.5 border border-zinc-300 rounded text-sm bg-white focus:outline-none focus:border-zinc-500"
                                                    >
                                                        <option value="area">Area Chart (Gradient)</option>
                                                        <option value="bar">Bar Chart</option>
                                                        <option value="line">Line Chart</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Pie Chart */}
                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                            <div>
                                                <span className="text-sm text-zinc-700 font-medium">Production Status Chart</span>
                                                <p className="text-xs text-zinc-500">Pie chart breakdown of order statuses</p>
                                            </div>
                                            <button
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    preferences: {
                                                        ...formData.preferences,
                                                        dashboard: {
                                                            ...formData.preferences.dashboard,
                                                            statusPie: {
                                                                ...formData.preferences.dashboard.statusPie,
                                                                show: !formData.preferences.dashboard.statusPie.show
                                                            }
                                                        }
                                                    }
                                                })}
                                                className={`w-11 h-6 flex items-center rounded-full transition-colors ${formData.preferences.dashboard.statusPie.show ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-200 border-zinc-200'} border`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.preferences.dashboard.statusPie.show ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Financials Preferences */}
                                <div className="p-5 bg-zinc-50 rounded-lg border border-zinc-100">
                                    <h3 className="text-sm font-medium text-zinc-900 mb-4">Financial Reports</h3>
                                    <div className="space-y-6">
                                        {/* Financial Revenue Chart */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm text-zinc-700 font-medium">Revenue Analysis Chart</span>
                                                    <p className="text-xs text-zinc-500">Monthly revenue and profit visualization</p>
                                                </div>
                                                <button
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        preferences: {
                                                            ...formData.preferences,
                                                            financials: {
                                                                ...formData.preferences.financials,
                                                                revenueChart: {
                                                                    ...formData.preferences.financials.revenueChart,
                                                                    show: !formData.preferences.financials.revenueChart.show
                                                                }
                                                            }
                                                        }
                                                    })}
                                                    className={`w-11 h-6 flex items-center rounded-full transition-colors ${formData.preferences.financials.revenueChart.show ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-200 border-zinc-200'} border`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.preferences.financials.revenueChart.show ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {formData.preferences.financials.revenueChart.show && (
                                                <div className="flex items-center justify-between pl-4 border-l-2 border-zinc-200">
                                                    <span className="text-sm text-zinc-600">Chart Type</span>
                                                    <select
                                                        value={formData.preferences.financials.revenueChart.type}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            preferences: {
                                                                ...formData.preferences,
                                                                financials: {
                                                                    ...formData.preferences.financials,
                                                                    revenueChart: {
                                                                        ...formData.preferences.financials.revenueChart,
                                                                        type: e.target.value as any
                                                                    }
                                                                }
                                                            }
                                                        })}
                                                        className="px-3 py-1.5 border border-zinc-300 rounded text-sm bg-white focus:outline-none focus:border-zinc-500"
                                                    >
                                                        <option value="area">Area Chart (Gradient)</option>
                                                        <option value="bar">Bar Chart</option>
                                                        <option value="line">Line Chart</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expenses Pie Chart */}
                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                            <div>
                                                <span className="text-sm text-zinc-700 font-medium">Expense Breakdown Chart</span>
                                                <p className="text-xs text-zinc-500">Distribution of costs (Fabric, Stitching, etc.)</p>
                                            </div>
                                            <button
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    preferences: {
                                                        ...formData.preferences,
                                                        financials: {
                                                            ...formData.preferences.financials,
                                                            expensesPie: {
                                                                ...formData.preferences.financials.expensesPie,
                                                                show: !formData.preferences.financials.expensesPie.show
                                                            }
                                                        }
                                                    }
                                                })}
                                                className={`w-11 h-6 flex items-center rounded-full transition-colors ${formData.preferences.financials.expensesPie.show ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-200 border-zinc-200'} border`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.preferences.financials.expensesPie.show ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                                    {saveSuccess ? (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md text-sm font-medium animate-fade-in">
                                            <CheckCircle size={14} /> Saved
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-900 mb-6">Notification Preferences</h2>
                            <div className="space-y-4">
                                {['Order Updates', 'Low Stock Alerts', 'Client Messages', 'Weekly Reports'].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-md border border-zinc-100">
                                        <span className="font-medium text-sm text-zinc-700">{item}</span>
                                        <div className="w-10 h-5 bg-zinc-900 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 bottom-1 w-3 bg-white rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-900 mb-6">Security</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-50 rounded-md border border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm text-zinc-900">Two-Factor Authentication</p>
                                        </div>
                                        <button className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs font-medium hover:bg-zinc-50 transition-colors">
                                            Enable
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-md border border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm text-zinc-900">Change Password</p>
                                            <p className="text-xs text-zinc-500 mt-1">Last changed 30 days ago</p>
                                        </div>
                                        <button className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs font-medium hover:bg-zinc-50 transition-colors">
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-900 mb-6">Billing</h2>
                            <div className="p-6 bg-zinc-50 rounded-md border border-zinc-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Current Plan</span>
                                        <p className="text-xl font-semibold text-zinc-900 mt-1">Pro Workspace</p>
                                    </div>
                                    <button className="px-3 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-black transition-colors">
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
