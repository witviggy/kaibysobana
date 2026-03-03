
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { User, Bell, Shield, Wallet, Save, RefreshCw, CheckCircle, Camera, X, UserPlus, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const { refreshUser, user: authUser } = useAuth();
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
            dashboard: { revenueChart: { show: true, type: 'area' }, statusPie: { show: true } },
            financials: { revenueChart: { show: true, type: 'area' }, expensesPie: { show: true } }
        }
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Add member state
    const [members, setMembers] = useState<any[]>([]);
    const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'member' });
    const [addingMember, setAddingMember] = useState(false);
    const [showMemberPassword, setShowMemberPassword] = useState(false);

    // Global App Settings
    const [appSettings, setAppSettings] = useState({ appName: '', logoUrl: '' });
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const fetchData = async () => {
            try {
                const data = await api.getCurrentUser();
                setUser(data);
                const defaultPrefs = {
                    dashboard: { revenueChart: { show: true, type: 'area' }, statusPie: { show: true } },
                    financials: { revenueChart: { show: true, type: 'area' }, expensesPie: { show: true } }
                };
                const userPrefs = data.preferences || {};
                setFormData({
                    name: data.name, email: data.email, avatarUrl: data.avatarUrl || '', nickname: data.nickname || '',
                    preferences: {
                        dashboard: { ...defaultPrefs.dashboard, ...(userPrefs.dashboard || {}) },
                        financials: { ...defaultPrefs.financials, ...(userPrefs.financials || {}) }
                    }
                });
                // Fetch members if admin
                if (data.role === 'admin') {
                    try {
                        const users = await api.getUsers();
                        setMembers(users);
                        const settingsData = await api.getAppSettings();
                        if (settingsData) setAppSettings(settingsData);
                    } catch (e) { console.error(e); }
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
                addToast("Failed to load settings", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isOpen, addToast]);

    const handleSave = async () => {
        try {
            setIsSaving(true); setSaveSuccess(false);
            const updated = await api.updateCurrentUser(formData);
            if (isAdmin) {
                await api.updateAppSettings({ appName: appSettings.appName, logoUrl: appSettings.logoUrl });
            }
            setUser(updated);
            await refreshUser();
            setSaveSuccess(true);
            addToast("Settings saved", 'success');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            addToast("Failed to save", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                setIsUploadingLogo(true);
                const res = await api.uploadImage(e.target.files[0], 'appconfig');
                setAppSettings({ ...appSettings, logoUrl: res.url });
                addToast("Logo uploaded successfully", "success");
            } catch (error) {
                console.error("Upload error", error);
                addToast("Failed to upload logo", "error");
            } finally {
                setIsUploadingLogo(false);
            }
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast("Passwords do not match", 'error'); return;
        }
        if (passwordData.newPassword.length < 6) {
            addToast("Password must be at least 6 characters", 'error'); return;
        }
        try {
            setPasswordSaving(true);
            await api.changePassword(user.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            addToast("Password updated successfully", 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            addToast(error?.message || "Failed to change password", 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMember.name || !newMember.email || !newMember.password) {
            addToast("All fields are required", 'error'); return;
        }
        try {
            setAddingMember(true);
            const created = await api.createUser(newMember);
            setMembers(prev => [created, ...prev]);
            setNewMember({ name: '', email: '', password: '', role: 'member' });
            addToast("Member added successfully", 'success');
        } catch (error: any) {
            addToast(error?.message || "Failed to add member", 'error');
        } finally {
            setAddingMember(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Camera },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        ...(isAdmin ? [{ id: 'members', label: 'Members', icon: UserPlus }] : []),
        { id: 'billing', label: 'Billing', icon: Wallet },
    ];

    if (!isOpen) return null;

    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`w-11 h-6 flex items-center rounded-full transition-colors ${value ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    const PasswordInput = ({ label, value, onChange, show, onToggle }: any) => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    placeholder="••••••••"
                />
                <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[650px] flex flex-col overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900">Settings</h2>
                        <p className="text-xs text-zinc-500">Manage your account preferences</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <RefreshCw size={24} className="animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="flex flex-1 min-h-0">
                        {/* Tab Sidebar */}
                        <div className="w-44 shrink-0 border-r border-zinc-100 bg-zinc-50/50 p-3 space-y-0.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                            : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-700'
                                            }`}
                                    >
                                        <Icon size={15} className={isActive ? 'text-zinc-900' : 'text-zinc-400'} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">

                            {activeTab === 'profile' && (
                                <>
                                    <div className="flex items-center gap-5 p-5 bg-zinc-50 border border-zinc-100 rounded-lg">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                                            <img
                                                src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=f4f4f5&color=18181b&bold=true&size=128`}
                                                alt="Profile" className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-zinc-900">{formData.nickname || user?.name}</h3>
                                            <p className="text-sm text-zinc-500">{user?.email}</p>
                                            <span className="mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wide bg-zinc-100 px-2 py-0.5 rounded inline-block">{user?.role || 'Admin'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <h3 className="text-sm font-semibold text-zinc-900">Personal Information</h3>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-600">Full Name</label>
                                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-600">Nickname</label>
                                                <input type="text" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} placeholder="e.g. Chief, Boss" className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-zinc-600">Email Address</label>
                                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-600">Avatar</label>
                                            <div className="grid grid-cols-6 gap-3">
                                                {['https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 'https://api.dicebear.com/7.x/notionists/svg?seed=Lilly', 'https://api.dicebear.com/7.x/micah/svg?seed=Oliver', 'https://api.dicebear.com/7.x/personas/svg?seed=Willow', 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'].map((url, i) => (
                                                    <button key={i} onClick={() => setFormData({ ...formData, avatarUrl: url })} className={`aspect-square rounded-full border-2 overflow-hidden hover:scale-105 transition-transform ${formData.avatarUrl === url ? 'border-zinc-900 ring-2 ring-zinc-100' : 'border-transparent hover:border-zinc-300'}`}>
                                                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full bg-zinc-50" />
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="text" placeholder="Or paste a custom image URL..." value={formData.avatarUrl} onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                        </div>
                                    </div>

                                    {/* Application Settings (Admin Only) */}
                                    {isAdmin && (
                                        <div className="space-y-5 pt-5 border-t border-zinc-100 mt-6">
                                            <h3 className="text-sm font-semibold text-zinc-900">Application Configuration</h3>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-600">Application Name</label>
                                                    <input type="text" value={appSettings.appName || ''} onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })} placeholder="e.g. கை(kai)" className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                                </div>
                                                <div className="space-y-1.5 flex flex-col justify-end">
                                                    <label className="flex items-center justify-between text-xs font-medium text-zinc-600">
                                                        <span>Logo Image</span>
                                                        <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                                                            <Camera size={13} />
                                                            {isUploadingLogo ? 'Uploading...' : 'Upload File'}
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                                        </label>
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        {appSettings.logoUrl && <img src={appSettings.logoUrl} alt="Logo" className="w-9 h-9 rounded bg-zinc-50 border border-zinc-200 object-contain shrink-0" />}
                                                        <input type="text" value={appSettings.logoUrl || ''} onChange={(e) => setAppSettings({ ...appSettings, logoUrl: e.target.value })} placeholder="e.g. /src/logo/kailogov1.png" className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Change Password</h3>
                                        <p className="text-xs text-zinc-500 mb-5">Update your password to keep your account secure.</p>
                                        <div className="space-y-4">
                                            <PasswordInput
                                                label="Current Password" value={passwordData.currentPassword}
                                                onChange={(e: any) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                show={showPasswords.current} onToggle={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <PasswordInput
                                                    label="New Password" value={passwordData.newPassword}
                                                    onChange={(e: any) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    show={showPasswords.new} onToggle={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                                                />
                                                <PasswordInput
                                                    label="Confirm New Password" value={passwordData.confirmPassword}
                                                    onChange={(e: any) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    show={showPasswords.confirm} onToggle={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                                                />
                                            </div>
                                            {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                                <p className="text-xs text-red-500">Passwords do not match</p>
                                            )}
                                            <button onClick={handlePasswordChange} disabled={passwordSaving || !passwordData.currentPassword || !passwordData.newPassword}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all disabled:opacity-40">
                                                {passwordSaving ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                                                {passwordSaving ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6 h-full flex flex-col items-center justify-center text-center opacity-70">
                                    <Shield size={32} className="text-zinc-400 mb-2" />
                                    <h3 className="text-sm font-semibold text-zinc-900">This feature is locked</h3>
                                    <p className="text-xs text-zinc-500 max-w-xs">Customizing appearance templates and colors requires an upgraded license tier.</p>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6 h-full flex flex-col items-center justify-center text-center opacity-70">
                                    <Shield size={32} className="text-zinc-400 mb-2" />
                                    <h3 className="text-sm font-semibold text-zinc-900">This feature is locked</h3>
                                    <p className="text-xs text-zinc-500 max-w-xs">Connecting external notification channels (like SMS or Discord) is currently disabled.</p>
                                </div>
                            )}

                            {activeTab === 'members' && isAdmin && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Add New Member</h3>
                                        <p className="text-xs text-zinc-500 mb-5">Create a new account for a team member.</p>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-600">Full Name</label>
                                                    <input type="text" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="John Doe" className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-600">Email Address</label>
                                                    <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder="john@kai.com" className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-600">Password</label>
                                                    <div className="relative">
                                                        <input type={showMemberPassword ? 'text' : 'password'} value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} placeholder="Min 6 characters" className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" />
                                                        <button type="button" onClick={() => setShowMemberPassword(!showMemberPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                                            {showMemberPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-600">Role</label>
                                                    <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500">
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={handleAddMember} disabled={addingMember || !newMember.name || !newMember.email || !newMember.password}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all disabled:opacity-40">
                                                {addingMember ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                                {addingMember ? 'Adding...' : 'Add Member'}
                                            </button>
                                        </div>
                                    </div>

                                    {members.length > 0 && (
                                        <div className="pt-5 border-t border-zinc-100">
                                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Team Members ({members.length})</h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {members.map(m => (
                                                    <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-md border border-zinc-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
                                                                {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={14} className="text-zinc-500" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-zinc-900">{m.name}</p>
                                                                <p className="text-xs text-zinc-500">{m.email}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${m.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>{m.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-6 h-full flex flex-col items-center justify-center text-center opacity-70">
                                    <Shield size={32} className="text-zinc-400 mb-2" />
                                    <h3 className="text-sm font-semibold text-zinc-900">This feature is locked</h3>
                                    <p className="text-xs text-zinc-500 max-w-xs">Billing and invoice management requires upgrading to the complete suite.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!isLoading && (
                    <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                        {saveSuccess ? (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-sm font-medium"><CheckCircle size={14} /> Saved</div>
                        ) : <div />}
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-md text-sm font-medium transition-colors">Close</button>
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all disabled:opacity-50">
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;
