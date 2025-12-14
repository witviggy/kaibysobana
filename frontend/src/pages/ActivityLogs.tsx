import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, CheckCircle2, AlertCircle, Trash2, Plus, Edit, FileText, User } from 'lucide-react';

const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await api.getActivityLogs();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch activity logs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getIcon = (action: string, type: string) => {
        if (action === 'DELETE') return <Trash2 size={16} className="text-red-500" />;
        if (action === 'CREATE') return <Plus size={16} className="text-emerald-500" />;
        if (action === 'UPDATE') return <Edit size={16} className="text-blue-500" />;
        return <FileText size={16} className="text-zinc-500" />;
    };

    const getEntityLabel = (type: string) => {
        switch (type) {
            case 'CLIENT': return 'Client';
            case 'ORDER': return 'Order';
            case 'FABRIC': return 'Fabric';
            case 'USER': return 'User Profile';
            default: return type;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Created';
            case 'UPDATE': return 'Updated';
            case 'DELETE': return 'Deleted';
            default: return action;
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Track Updates</h1>
                    <p className="text-zinc-500 mt-1">History of all changes in the application</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm flex items-center gap-2 text-sm font-medium text-zinc-600">
                    <Clock size={16} />
                    <span>Real-time Timeline</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                {logs.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${log.action === 'DELETE' ? 'bg-red-50 border-red-100' :
                                        log.action === 'CREATE' ? 'bg-emerald-50 border-emerald-100' :
                                            'bg-blue-50 border-blue-100'
                                        }`}>
                                        {getIcon(log.action, log.entityType)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {getActionLabel(log.action)} {getEntityLabel(log.entityType)}
                                            {log.entityType === 'ORDER' && <span className="text-zinc-500 ml-1">#{log.entityId.split('-')[1]}</span>}
                                        </p>
                                        <span className="text-xs text-zinc-400 whitespace-nowrap">{log.timestamp}</span>
                                    </div>

                                    <div className="text-sm text-zinc-600">
                                        {/* Render details in a readable way */}
                                        {log.details && Object.keys(log.details).length > 0 ? (
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {Object.entries(log.details).map(([key, value]) => (
                                                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-400 italic">No details provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900">No updates yet</h3>
                        <p className="text-zinc-500 mt-1">Recent changes will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
