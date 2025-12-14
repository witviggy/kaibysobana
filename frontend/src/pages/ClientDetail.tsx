
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Edit, ShoppingBag } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { OrderStatus } from '../types';

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                if (!id) return;
                const data = await api.getClient(id);
                setClient(data);
            } catch (error) {
                console.error("Failed to fetch client", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClient();
    }, [id]);

    if (isLoading) return <div className="p-10 text-center text-zinc-500 text-sm">Loading...</div>;
    if (!client) return <div className="p-10 text-center text-zinc-500 text-sm">Client not found</div>;

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Completed: return 'bg-emerald-100 text-emerald-700';
            case OrderStatus.InProgress: return 'bg-blue-100 text-blue-700';
            case OrderStatus.Pending: return 'bg-amber-100 text-amber-700';
            case OrderStatus.Cancelled: return 'bg-red-100 text-red-700';
            default: return 'bg-zinc-50 text-zinc-500';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Back Button */}
            <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Clients
            </button>

            {/* Header Profile */}
            <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200">
                        <img src={getMediaUrl(client.avatarUrl) || `https://ui-avatars.com/api/?name=${client.name}`} alt={client.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                        }`}>
                                        {client.status}
                                    </span>
                                    <span className="text-xs text-zinc-500">• Member since {client.memberSince}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                                    <Edit size={14} /> Edit
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors">
                                    <ShoppingBag size={14} /> New Order
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
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
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <h2 className="text-base font-semibold text-zinc-900">Order History</h2>
                    <div className="text-xs text-zinc-500">
                        Total Orders: <span className="font-semibold text-zinc-900">{client.recentOrders.length}</span>
                    </div>
                </div>

                {client.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100">
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {client.recentOrders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                        <td className="px-6 py-3 text-sm font-medium text-zinc-900">#{order.id.split('-')[1]}</td>
                                        <td className="px-6 py-3 text-sm text-zinc-600">{order.orderDate}</td>
                                        <td className="px-6 py-3 text-sm text-zinc-600">{order.quantity} x {order.fabricName}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm font-medium text-zinc-900 text-right">₹{parseFloat(order.sellingPrice).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-zinc-500 text-sm">No orders found.</div>
                )}
            </div>
        </div>
    );
};

export default ClientDetail;
