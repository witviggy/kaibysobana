import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Activity,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Scissors,
  IndianRupee,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { OrderStatus } from '../types';
import { api } from '../services/api';
import { SkeletonCard, SkeletonLine } from '../components/Skeleton';
import { TimeFilter } from '../components/TimeFilter';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const KpiCard = ({ title, value, icon: Icon, delay }: any) => {
  return (
    <div
      className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{title}</p>
          <p className="text-xl font-semibold text-zinc-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true); // Set loading true on re-fetch
      try {
        const [data, ordersData] = await Promise.all([
          api.getDashboardStats(timeRange),
          api.getOrders()
        ]);
        if (data) {
          setStats(data);
        }
        if (ordersData) {
          setOrders(ordersData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        addToast("Failed to load dashboard data", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [addToast, timeRange]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Emerald, Blue, Amber, Red

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <SkeletonLine width="200px" height="32px" />
            <SkeletonLine width="150px" height="16px" />
          </div>
          <div className="flex gap-3">
            <SkeletonLine width="100px" height="40px" />
            <SkeletonLine width="120px" height="40px" />
          </div>
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-white rounded-lg border border-zinc-200" />
          <div className="h-[380px] bg-white rounded-lg border border-zinc-200" />
        </div>
      </div>
    );
  }

  const { user, revenue, profit, activeOrders, statusData, lowStockFabrics, recentOrders, fabricUsageData, chartData } = stats;
  const avgMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Compute stats from orders (like Financials.tsx)
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
  const totalCost = filteredOrders.reduce((acc, curr) => acc + parseFloat(curr.totalCost || '0'), 0);

  // Extend chartData with margin logic
  const chartDataWithMargin = chartData?.map((entry: any) => ({
    ...entry,
    margin: entry.revenue > 0 ? (entry.profit / entry.revenue) * 100 : 0
  })) || [];

  // Expense breakdown derived from filtered orders
  const expenseBreakdown = [
    { name: 'Fabric Cost', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.fabricCost || '0'), 0), color: '#f59e0b' },
    { name: 'Stitching', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.stitchingCost || '0'), 0), color: '#ec4899' },
    { name: 'Courier', value: filteredOrders.reduce((acc, c) => acc + parseFloat(c.courierCostFromMe?.toString() || '0') + parseFloat(c.courierCostToMe?.toString() || '0'), 0), color: '#6366f1' },
    { name: 'Other', value: totalCost * 0.05, color: '#8b5cf6' }, // Approx remnant
  ];

  const handleExport = () => {
    import('../utils/csvExport').then(({ downloadCSV }) => {
      const exportData = [
        { Metric: 'Total Revenue', Value: revenue },
        { Metric: 'Net Profit', Value: profit },
        { Metric: 'Total Expenses', Value: totalCost },
        { Metric: 'Active Orders', Value: activeOrders },
        { Metric: 'Avg Margin', Value: `${avgMargin.toFixed(1)}%` },
        ...(fabricUsageData || []).map((d: any) => ({
          Metric: `Top Fabric (${d.name})`,
          Value: `${d.amount} used`
        }))
      ];
      downloadCSV(exportData, `Dashboard_Summary_${new Date().toISOString().split('T')[0]}`);
    });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {greeting}, {authUser?.nickname || authUser?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilter value={timeRange} onChange={setTimeRange} />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
          icon={IndianRupee}
          delay={0}
        />
        <KpiCard
          title="Net Profit"
          value={`₹${profit.toLocaleString()}`}
          icon={TrendingUp}
          delay={100}
        />
        <KpiCard
          title="Total Expenses"
          value={`₹${totalCost.toLocaleString()}`}
          icon={TrendingDown}
          delay={150}
        />
        <KpiCard
          title="Active Orders"
          value={activeOrders}
          icon={ShoppingBag}
          delay={200}
        />
        <KpiCard
          title="Avg. Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Activity}
          delay={300}
        />
      </div>

      {/* Main Analytics Grid */}
      {(stats.user?.preferences?.dashboard?.revenueChart?.show !== false || stats.user?.preferences?.dashboard?.statusPie?.show !== false || stats.user?.preferences?.financials?.expensesPie?.show !== false) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue & Profit Chart (merged from Financials) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Revenue & Profit</h2>
                <p className="text-xs text-zinc-500">Financial overview</p>
              </div>
            </div>
            <div className="h-[300px]">
              {chartDataWithMargin && chartDataWithMargin.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDataWithMargin} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none', padding: '8px 12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                      cursor={{ fill: '#f4f4f5' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                    <Area yAxisId="left" type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" name="Profit" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  No order data available
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          {stats.user?.preferences?.financials?.expensesPie?.show !== false && (
            <div className="bg-white p-6 rounded-lg border border-zinc-200 flex flex-col shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-zinc-900">Expense Breakdown</h2>
                <p className="text-xs text-zinc-500">Total cost distribution</p>
              </div>
              <div className="flex-1 min-h-[200px] relative">
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
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '12px', boxShadow: 'none' }}
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

          {/* Inventory & Alerts */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-red-50/50">
                <h2 className="text-base font-semibold text-red-900">Inventory Alerts</h2>
                {lowStockFabrics.length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {lowStockFabrics.length}
                  </span>
                )}
              </div>
              <div className="divide-y divide-zinc-50">
                {lowStockFabrics.length > 0 ? lowStockFabrics.map((fabric: any) => (
                  <div
                    key={fabric.id}
                    className="px-6 py-3 hover:bg-red-50/30 transition-colors cursor-pointer flex items-center gap-3"
                    onClick={() => navigate(`/stock/${fabric.id}`)}
                  >
                    <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{fabric.name}</p>
                      <p className="text-xs text-red-600 font-medium">{fabric.metersAvailable}m remaining</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300" />
                  </div>
                )) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-zinc-500">Stock levels are good.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profit Margin Trend Chart
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Profit Margin Trend</h2>
                <p className="text-xs text-zinc-500">Average margin over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartDataWithMargin} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none', padding: '8px 12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                  />
                  <Area type="monotone" dataKey="margin" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" name="Margin" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div> */}

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col shadow-sm transition-shadow hover:shadow-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Recent Orders</h2>
              </div>
              <button onClick={() => navigate('/orders')} className="text-xs text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-1 transition-colors">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Fabric</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {recentOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3">
                        <span className="text-xs font-mono text-zinc-600">#{order.id.split('-')[1]}</span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-zinc-900">{order.clientName}</td>
                      <td className="px-6 py-3 text-sm text-zinc-600">{order.fabricName}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {/* Vibrant badges for status */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === OrderStatus.Completed ? 'bg-emerald-100 text-emerald-700' :
                            order.status === OrderStatus.Cancelled ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-zinc-900 text-right">₹{parseFloat(order.sellingPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Fabrics Chart */}
          <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Top Fabrics Used</h2>
                <p className="text-xs text-zinc-500">Based on orders </p>
              </div>
            </div>
            <div className="h-[300px]">
              {fabricUsageData && fabricUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={fabricUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none', padding: '8px 12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                      cursor={{ fill: '#f4f4f5' }}
                      formatter={(value: number) => [`${value} units`, 'Used']}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24} name="Used">
                      {fabricUsageData.map((_: any, index: number) => {
                        const FABRIC_COLORS = ['#f97316', '#0ea5e9', '#8b5cf6', '#10b981', '#ec4899', '#eab308', '#6366f1', '#14b8a6'];
                        return <Cell key={`fab-${index}`} fill={FABRIC_COLORS[index % FABRIC_COLORS.length]} />;
                      })}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  No fabric data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      </div>
    </div >
  );
};

export default Dashboard;
