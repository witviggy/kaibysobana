
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

                    {/* Remarks Card (General Order Remarks) */}
                    {order.remarks && (
                        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 shadow-sm mb-6">
                            <h3 className="text-sm font-semibold text-amber-900 mb-2.5 flex items-center gap-2">
                                Order Remarks
                            </h3>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">{order.remarks}</p>
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
                            <h3 className="text-sm font-medium text-zinc-900 mb-4">Items List</h3>
                            <div className="space-y-4">
                                {(order.items && order.items.length > 0 ? order.items : [order]).map((item: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-white rounded-md border border-zinc-200 flex items-center justify-center shrink-0">
                                                <Scissors size={20} className="text-zinc-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-zinc-900">{item.dressName || 'Custom Tailoring'}</h4>
                                                        <p className="text-xs text-zinc-500 mb-1">
                                                            Fabric: {item.fabricName || 'Unknown'} {item.fabricColor ? `• ${item.fabricColor}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-zinc-900">x{item.quantity || 1}</p>
                                                        <p className="text-sm font-bold text-zinc-900 mt-0.5">₹{parseFloat(item.sellingPrice || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 bg-white p-2 rounded border border-zinc-100">
                                                    <div className="flex">
                                                        <span className="font-medium text-zinc-500 w-16">Size:</span>
                                                        <span className="font-semibold text-zinc-900">{item.sizeChart || 'M'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="font-medium text-zinc-500 w-16">Req:</span>
                                                        <span className="text-zinc-900">{item.fabricRequired || '0'} m</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="font-medium text-zinc-500 w-16">Stitching:</span>
                                                        <span className="text-zinc-900">₹{parseFloat(item.stitchingCost || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="font-medium text-zinc-500 w-16">Fabric Cost:</span>
                                                        <span className="text-zinc-900">₹{parseFloat(item.fabricCost || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {Number(item.profitMargin) > 0 && (
                                                    <div className="mt-2 text-right">
                                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                            {item.profitMargin}% Margin
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Costs Breakdown */}
                    <div className="bg-zinc-900 rounded-lg shadow-lg p-6 text-white mb-6">
                        <h3 className="text-sm font-semibold mb-4">Total Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Items Revenue</span>
                                <span className="font-medium">₹{parseFloat(order.sellingPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Delivery Charges</span>
                                <span className="font-medium">₹{(parseFloat(order.courierCostFromMe || 0) + parseFloat(order.courierCostToMe || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Bill</span>
                                <span>₹{(parseFloat(order.sellingPrice || 0) + parseFloat(order.courierCostFromMe || 0) + parseFloat(order.courierCostToMe || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between text-zinc-400 text-xs mt-4">
                                <span>Production (Fabric + Stitching)</span>
                                <span>₹{(parseFloat(order.fabricCost || 0) + parseFloat(order.stitchingCost || 0)).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 text-xs">
                                <span>Logistics Courier</span>
                                <span>₹{(parseFloat(order.courierCostFromMe || 0) + parseFloat(order.courierCostToMe || 0)).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 mt-2 border-t border-white/10">
                                <span>Net Profit</span>
                                <span className={parseFloat(order.profit) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    ₹{parseFloat(order.profit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900">Customer Details</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-zinc-600 font-bold border border-zinc-200">
                                    {order.clientName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">{order.clientName}</p>
                                    <p className="text-[11px] text-zinc-500">{order.clientEmail || 'No Email Provided'}</p>
                                </div>
                            </div>

                            {(order.clientPhone || order.clientAddress) && (
                                <div className="space-y-3 pt-2 text-sm">
                                    {order.clientPhone && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Phone Number</p>
                                            <p className="text-zinc-800 font-medium">{order.clientPhone}</p>
                                        </div>
                                    )}
                                    {order.clientAddress && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Shipping Address</p>
                                            <p className="text-zinc-800 text-xs leading-relaxed">{order.clientAddress}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => navigate(`/clients/${order.clientId}`)}
                                className="w-full mt-2 py-2 text-xs font-semibold text-zinc-700 bg-white border-2 border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                            >
                                View Client History
                            </button>
                        </div>
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
