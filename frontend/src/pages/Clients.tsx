
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, User, Phone, Mail, MapPin, ArrowUpRight, Users, Download, Trash2, UserPlus } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { useSearch } from '../context/SearchContext';

const Clients: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { globalSearchQuery: searchQuery } = useSearch();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<any>(null);

    const fetchClients = async () => {
        try {
            const data = await api.getClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const matchesSearch = (text: string | undefined, query: string) => {
        if (!text || !query) return false;
        const lowerText = text.toString().toLowerCase();
        const lowerQuery = query.toLowerCase();
        return lowerText.startsWith(lowerQuery) || lowerText.split(/\s+/).some(word => word.startsWith(lowerQuery));
    };

    const filteredClients = clients.filter(client => {
        if (!searchQuery) return true;
        return matchesSearch(client.name, searchQuery) ||
            matchesSearch(client.email, searchQuery) ||
            (client.phone && client.phone.startsWith(searchQuery)) ||
            matchesSearch(client.address, searchQuery);
    });

    const activeCount = clients.filter(c => c.status === 'Active').length;

    const handleExport = () => {
        import('../utils/csvExport').then(({ downloadCSV }) => {
            const dataToExport = filteredClients.map(c => ({
                ID: c.id,
                Name: c.name,
                Email: c.email,
                Phone: c.phone,
                Address: c.address,
                Status: c.status,
                'Member Since': c.memberSince,
                'Last Order': c.lastOrderDate
            }));
            downloadCSV(dataToExport, `Clients_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        try {
            await api.deleteClient(clientToDelete.id);
            addToast("Client deleted successfully", 'success');
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
            fetchClients();
        } catch (error) {
            console.error(error);
            addToast("Failed to delete client", 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Clients</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage your customer base.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                    {/* <button
                        onClick={() => navigate('/clients/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all">
                        <Plus size={16} /> Add Client
                    </button> */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Clients</p>
                            <p className="text-xl font-semibold text-zinc-900">{clients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center text-emerald-600">
                            <ArrowUpRight size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Active</p>
                            <p className="text-xl font-semibold text-zinc-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Inactive</p>
                            <p className="text-xl font-semibold text-zinc-400">{clients.length - activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center text-blue-500">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">New This Month</p>
                            <p className="text-xl font-semibold text-zinc-900">+{Math.min(3, clients.length)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-zinc-500">Loading clients...</div>
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer group flex flex-col overflow-hidden hover:shadow-sm"
                        >
                            <div className="p-5 flex items-start justify-between">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 overflow-hidden">
                                        {client.avatarUrl ? (
                                            <img src={getMediaUrl(client.avatarUrl)} alt={client.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-black transition-colors">{client.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${client.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                                                }`}>
                                                {client.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 pb-5 space-y-2 flex-1">
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <Mail size={14} className="text-zinc-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <Phone size={14} className="text-zinc-400" />
                                    <span>{client.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <MapPin size={14} className="text-zinc-400" />
                                    <span className="truncate">{client.address}</span>
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                <div className="text-xs text-zinc-500">
                                    Last Order: <span className="font-medium text-zinc-900">{client.lastOrderDate || '-'}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setClientToDelete(client);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors p-1">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        <p>No clients found.</p>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Delete Client"
                message={`Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone and will permanently remove all associated records.`}
                confirmText="Delete Client"
                onConfirm={handleDeleteClient}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setClientToDelete(null);
                }}
            />
        </div>
    );
};

export default Clients;
