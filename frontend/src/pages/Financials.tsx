import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, Download, Calendar, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../services/api';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const Financials: React.FC = () => {
    const { addToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('6m');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, userData] = await Promise.all([
                    api.getOrders(),
                    api.getCurrentUser()
                ]);
                setOrders(ordersData);
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch financial data", error);
                addToast("Failed to load financial data", 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [addToast]);

    // Filter Logic
    const getFilteredOrders = () => {
        const now = new Date();
        const cutoff = new Date();

        switch (timeRange) {
            case '7d': cutoff.setDate(now.getDate() - 7); break;
            case '30d': cutoff.setDate(now.getDate() - 30); break;
            case '6m': cutoff.setMonth(now.getMonth() - 6); break;
            case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
            default: cutoff.setMonth(now.getMonth() - 6);
        }

        return orders.filter(o => {
            const d = new Date(o.orderDate);
            return d >= cutoff && o.status !== 'Cancelled';
        });
    };

    const filteredOrders = getFilteredOrders();

    const totalRevenue = filteredOrders.reduce((acc, curr) => acc + parseFloat(curr.sellingPrice), 0);
    const totalProfit = filteredOrders.reduce((acc, curr) => acc + parseFloat(curr.profit), 0);
    const totalCost = filteredOrders.reduce((acc, curr) => acc + parseFloat(curr.totalCost), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Chart Data Generation
    const getChartData = () => {
        const dataMap = new Map();
        const isDaily = timeRange === '7d' || timeRange === '30d';

        filteredOrders.forEach(o => {
            const d = new Date(o.orderDate);
            // Format: "Jan 12" for daily, "Jan" for monthly
            const key = isDaily
                ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d.toLocaleDateString('en-US', { month: 'short' });

            // Sort key (timestamp for correct ordering)
            // For Monthly we use First day of month timestamp
            const sortKey = isDaily
                ? d.getTime()
                : new Date(d.getFullYear(), d.getMonth(), 1).getTime();

            if (!dataMap.has(key)) {
                dataMap.set(key, { name: key, revenue: 0, profit: 0, sortKey });
            }
            const entry = dataMap.get(key);
            entry.revenue += parseFloat(o.sellingPrice);
            entry.profit += parseFloat(o.profit);
        });

        return Array.from(dataMap.values())
            .sort((a, b) => a.sortKey - b.sortKey);
    };

    const chartData = getChartData();

    // Vibrant palette for expenses
    const expenseBreakdown = [
        { name: 'Fabric Cost', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.fabricCost || 0), 0), color: '#f59e0b' },
        { name: 'Stitching', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.stitchingCost || 0), 0), color: '#ec4899' },
        { name: 'Courier', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.courierCostFromMe || 0) + parseFloat(c.courierCostToMe || 0), 0), color: '#6366f1' },
        { name: 'Other', value: totalCost * 0.05, color: '#8b5cf6' }, // Approx remnant
    ];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                <div className="flex justify-between items-end">
                    <div className="space-y-2">
                        <SkeletonLine width="200px" height="32px" />
                        <SkeletonLine width="150px" height="16px" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[380px] bg-white rounded-lg border border-zinc-200" />
                    <div className="h-[380px] bg-white rounded-lg border border-zinc-200" />
                </div>
            </div>
        );
    }

    const handleExport = () => {
        import('../utils/csvExport').then(({ downloadCSV }) => {
            const dataToExport = filteredOrders.map(o => ({
                ID: o.id,
                Date: new Date(o.orderDate).toLocaleDateString(),
                Client: o.clientName,
                Fabric: o.fabricName,
                Status: o.status,
                'Selling Price': o.sellingPrice,
                'Fabric Cost': o.fabricCost || 0,
                'Stitching Cost': o.stitchingCost || 0,
                'Courier Cost': (Number(o.courierCostFromMe || 0) + Number(o.courierCostToMe || 0)),
                Profit: o.profit,
                'Total Cost': o.totalCost
            }));
            downloadCSV(dataToExport, `Financials_${timeRange}_${new Date().toISOString().split('T')[0]}`);
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Financial Overview</h1>
                    <p className="text-zinc-500 text-sm mt-1">Track revenue and expenses.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="pl-8 pr-4 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-300 cursor-pointer appearance-none"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="6m">Last 6 Months</option>
                            <option value="1y">Last Year</option>
                        </select>
                        <Calendar size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors shadow-sm"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-1.5 bg-zinc-100 rounded text-zinc-600">
                            <IndianRupee size={18} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <ArrowUpRight size={12} /> 12.5%
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Revenue</p>
                    <h3 className="text-xl font-semibold text-zinc-900 mt-0.5">₹{totalRevenue.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-1.5 bg-zinc-100 rounded text-zinc-600">
                            <TrendingUp size={18} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <ArrowUpRight size={12} /> 8.2%
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Net Profit</p>
                    <h3 className="text-xl font-semibold text-zinc-900 mt-0.5">₹{totalProfit.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-1.5 bg-zinc-100 rounded text-zinc-600">
                            <TrendingDown size={18} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                            <ArrowUpRight size={12} /> 2.4%
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Expenses</p>
                    <h3 className="text-xl font-semibold text-zinc-900 mt-0.5">₹{totalCost.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-1.5 bg-zinc-100 rounded text-zinc-600">
                            <Activity size={18} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <ArrowUpRight size={12} /> 1.2%
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Profit Margin</p>
                    <h3 className="text-xl font-semibold text-zinc-900 mt-0.5">{avgMargin.toFixed(1)}%</h3>
                </div>
            </div>

            {/* Charts Grid */}
            {(user?.preferences?.financials?.revenueChart?.show !== false || user?.preferences?.financials?.expensesPie?.show !== false) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    {user?.preferences?.financials?.revenueChart?.show !== false && (
                        <div className={`${user?.preferences?.financials?.expensesPie?.show === false ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-base font-semibold text-zinc-900">Revenue & Profit</h2>

                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none', padding: '8px 12px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        />
                                        {(!user?.preferences?.financials?.revenueChart?.type || user?.preferences?.financials?.revenueChart?.type === 'area') && (
                                            <>
                                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                                <Area type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" name="Profit" />
                                            </>
                                        )}
                                        {user?.preferences?.financials?.revenueChart?.type === 'bar' && (
                                            <>
                                                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                                                <Bar dataKey="profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Profit" />
                                            </>
                                        )}
                                        {user?.preferences?.financials?.revenueChart?.type === 'line' && (
                                            <>
                                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
                                                <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Profit" />
                                            </>
                                        )}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Expense Breakdown */}
                    {user?.preferences?.financials?.expensesPie?.show !== false && (
                        <div className={`${user?.preferences?.financials?.revenueChart?.show === false ? 'lg:col-span-3' : ''} bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow`}>
                            <h2 className="text-base font-semibold text-zinc-900 mb-6">Expense Breakdown</h2>
                            <div className="h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            cornerRadius={4}
                                            stroke="none"
                                        >
                                            {expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none' }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            itemStyle={{ color: '#18181b' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <span className="block text-xl font-bold text-zinc-900">₹{(totalCost / 1000).toFixed(0)}K</span>
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Total</span>
                                </div>
                            </div>
                            <div className="space-y-3 mt-6">
                                {expenseBreakdown.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-zinc-600">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-zinc-900">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Financials;
