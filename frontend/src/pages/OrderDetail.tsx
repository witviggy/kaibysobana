
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Scissors, User, Calendar, Truck } from 'lucide-react';
import { api } from '../services/api';
import { OrderStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';

const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (!id) return;
                const data = await api.getOrder(id);
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch order", error);
                addToast("Failed to load order details", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleDelete = async () => {
        try {
            if (!id) return;
            await api.deleteOrder(order.id);
            addToast("Order deleted successfully", 'success');
            navigate('/orders');
        } catch (error) {
            addToast("Failed to delete order", 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
                <SkeletonLine width="200px" height="24px" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <div className="space-y-6">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return <div className="p-10 text-center text-zinc-500 text-sm">Order not found</div>;

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Completed: return 'bg-emerald-100 text-emerald-700 border-emerald-100';
            case OrderStatus.InProgress: return 'bg-blue-100 text-blue-700 border-blue-100';
            case OrderStatus.Pending: return 'bg-amber-100 text-amber-700 border-amber-100';
            case OrderStatus.Cancelled: return 'bg-red-100 text-red-700 border-red-100';
            default: return 'bg-zinc-50 text-zinc-500 border-zinc-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

            {/* Navbar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Orders
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors">
                        Delete
                    </button>
                    <button
                        onClick={() => navigate(`/orders/edit/${order.id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
                        Edit
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Requirements Card (New) */}
                    {(order.sizeChart || order.remarks) && (
                        <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm mb-6">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                <Scissors size={16} className="text-zinc-500" /> Requirements & Customization
                            </h3>
                            <div className="space-y-4">
                                {order.dressName && (
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Dress Name</p>
                                        <p className="text-sm text-zinc-900">{order.dressName}</p>
                                    </div>
                                )}
                                {order.sizeChart && (
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Size Chart / Measurements</p>
                                        <p className="text-sm text-zinc-900 whitespace-pre-wrap bg-zinc-50 p-3 rounded-md border border-zinc-100">{order.sizeChart}</p>
                                    </div>
                                )}
                                {order.remarks && (
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Remarks</p>
                                        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{order.remarks}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Order Header */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-semibold text-zinc-900">Order #{order.id.split('-')[1]}</h1>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">Placed on {order.orderDate}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="border-t border-zinc-100 pt-6">
                            <h3 className="text-sm font-medium text-zinc-900 mb-4">Items</h3>
                            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-md border border-zinc-100">
                                <div className="w-12 h-12 bg-white rounded border border-zinc-200 flex items-center justify-center">
                                    <Scissors size={20} className="text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-zinc-900">{order.dressName || 'Custom Tailoring'}</h4>
                                    <p className="text-xs text-zinc-500">
                                        Fabric: {order.fabricName} • {order.fabricColor}
                                        {order.fabricRequired && ` • Required: ${order.fabricRequired}m`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-zinc-900">x{order.quantity}</p>
                                    <p className="text-sm font-semibold text-zinc-900 mt-1">₹{parseFloat(order.sellingPrice).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Costs Breakdown */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-zinc-900 mb-4">Financials</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-600">
                                <span>Stitching Cost</span>
                                <span>₹{parseFloat(order.stitchingCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Fabric Cost</span>
                                <span>₹{parseFloat(order.fabricCost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Courier (From Me)</span>
                                <span>₹{parseFloat(order.courierCostFromMe || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Courier (To Me)</span>
                                <span>₹{parseFloat(order.courierCostToMe || 0).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-zinc-100 pt-2 mt-2 flex justify-between font-medium text-zinc-900">
                                <span>Total Cost</span>
                                <span>₹{parseFloat(order.totalCost).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-zinc-100 pt-2 mt-2 flex justify-between font-medium text-zinc-900">
                                <span>Net Profit</span>
                                <span className={(order.profit >= 0) ? 'text-emerald-600' : 'text-red-600'}>
                                    ₹{parseFloat(order.profit).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Customer</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-900">{order.clientName}</p>
                                <p className="text-xs text-zinc-500">{order.clientEmail}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/clients/${order.clientId}`)}
                            className="w-full py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors"
                        >
                            View Profile
                        </button>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Delivery</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Calendar size={16} className="text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase font-semibold">Expected Delivery</p>
                                    <p className="text-sm font-medium text-zinc-900">{order.deliveryDate}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Truck size={16} className="text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase font-semibold">Shipping Method</p>
                                    <p className="text-sm font-medium text-zinc-900">Standard Courier</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Order"
                message="Are you sure you want to delete this order? This action cannot be undone."
                isDestructive
            />
        </div>
    );
};

export default OrderDetail;
