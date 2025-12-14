
import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SkeletonLine, SkeletonCircle } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const Notifications: React.FC = () => {
    const { addToast } = useToast();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const data = await api.getNotifications();
                setNotifications(data);
            } catch (e) {
                console.error(e);
                addToast("Failed to load notifications", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifs();
    }, [addToast]);

    const handleMarkAllRead = () => {
        // Optimistic update
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
        addToast("All notifications marked as read", 'success');
        // In real app, would call API here
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Notifications</h1>
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="divide-y divide-zinc-100 p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 p-2">
                                <SkeletonCircle size="32px" />
                                <div className="flex-1 space-y-2">
                                    <SkeletonLine width="80%" height="16px" />
                                    <SkeletonLine width="40%" height="12px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {notifications.map((notif, index) => {
                            const getNotifStyle = (type: string) => {
                                switch (type) {
                                    case 'warning': return { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', icon: AlertCircle };
                                    case 'alert': return { bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', icon: AlertCircle };
                                    case 'success': return { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', icon: Check };
                                    case 'info': return { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', icon: Bell };
                                    default: return { bg: 'bg-zinc-50', iconBg: 'bg-zinc-100', iconColor: 'text-zinc-500', icon: Bell };
                                }
                            };
                            const style = getNotifStyle(notif.type);
                            const Icon = style.icon;

                            return (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-zinc-50 transition-colors flex gap-4 ${!notif.isRead ? style.bg : ''}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`mt-1 w-8 h-8 rounded-full ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0`}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-900 font-medium leading-normal">{notif.message}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1"><Clock size={10} /> {notif.time}</span>
                                            {notif.isRead && <span className="flex items-center gap-1 text-zinc-400"><Check size={10} /> Read</span>}
                                        </div>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-zinc-900 mt-2 shrink-0"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center text-zinc-500 text-sm">No notifications found.</div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
