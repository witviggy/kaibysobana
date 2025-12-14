
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ShoppingBag, Calendar, CheckCircle2, Clock, Scissors, XCircle, ArrowUpRight, Download } from 'lucide-react';
import { api } from '../services/api';
import { OrderStatus } from '../types';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const Orders: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await api.getOrders();
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
                addToast("Failed to load orders", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [addToast]);

    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(query) ||
            order.clientName.toLowerCase().includes(query) ||
            (order.dressName && order.dressName.toLowerCase().includes(query)) ||
            (order.fabricName && order.fabricName.toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        import('../utils/csvExport').then(({ downloadCSV }) => {
            const dataToExport = filteredOrders.map(o => ({
                ID: o.id,
                Client: o.clientName,
                Date: o.orderDate,
                Fabric: o.fabricName,
                Dress: o.dressName,
                Quantity: o.quantity,
                Status: o.status,
                Amount: o.sellingPrice,
                Delivery: o.deliveryDate
            }));
            downloadCSV(dataToExport, `Orders_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Completed:
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 };
            case OrderStatus.InProgress:
                return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Scissors };
            case OrderStatus.Pending:
                return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
            case OrderStatus.Cancelled:
                return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle };
            default:
                return { bg: 'bg-zinc-100', text: 'text-zinc-500', icon: XCircle };
        }
    };

    const statusCounts = {
        'All': orders.length,
        'Pending': orders.filter(o => o.status === 'Pending').length,
        'In Progress': orders.filter(o => o.status === 'In Progress').length,
        'Completed': orders.filter(o => o.status === 'Completed').length,
        'Cancelled': orders.filter(o => o.status === 'Cancelled').length
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Orders</h1>
                    <p className="text-zinc-500 text-sm mt-1">Track production orders.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={() => navigate('/clients/new-order')}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all shadow-sm"
                    >
                        <Plus size={16} /> Create Order
                    </button>
                </div>
            </div>

            {/* Stats / Filter Bar */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {['All', 'Pending', 'In Progress', 'Completed'].map((status) => {
                    const isActive = statusFilter === status;
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all border whitespace-nowrap ${isActive
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                }`}
                        >
                            {status} <span className={`ml-1 text-xs ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>({statusCounts[status as keyof typeof statusCounts]})</span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by order ID, client name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-md bg-white border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden transition-shadow hover:shadow-sm">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center animate-pulse">
                                <div className="space-y-2">
                                    <SkeletonLine width="200px" height="20px" />
                                    <SkeletonLine width="150px" height="14px" />
                                </div>
                                <SkeletonLine width="100px" height="24px" />
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100">
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Order Details</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filteredOrders.map((order) => {
                                    const statusConfig = getStatusConfig(order.status);
                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-500">
                                                        <ShoppingBag size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-zinc-900 text-sm">#{order.id.split('-')[1]}</p>
                                                        <p className="text-xs text-zinc-500">{order.quantity} items • {order.fabricName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-zinc-700">{order.clientName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                    <Calendar size={14} className="text-zinc-400" />
                                                    <span>{order.orderDate}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-medium text-zinc-900">₹{parseFloat(order.sellingPrice).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                    <ArrowUpRight size={16} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-zinc-500">
                        <p className="text-sm">No orders found.</p>
                        <button
                            onClick={() => navigate('/clients/new-order')}
                            className="mt-4 text-sm font-medium text-zinc-900 underline hover:text-black"
                        >
                            Create Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
