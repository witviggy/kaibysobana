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
  TrendingUp
} from 'lucide-react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { OrderStatus } from '../types';
import { api } from '../services/api';
import { SkeletonCard, SkeletonLine } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const KpiCard = ({ title, value, trend, trendValue, icon: Icon, delay }: any) => {
  const isPositive = trend === 'up';

  return (
    <div
      className="bg-white p-6 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-md bg-zinc-100 text-zinc-900">
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${title === 'Active Orders' && !isPositive ? 'bg-emerald-50 text-emerald-700' : isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm text-zinc-500">{title}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true); // Set loading true on re-fetch
      try {
        const data = await api.getDashboardStats(timeRange);
        if (data) {
          setStats(data);
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

  const { user, revenue, profit, activeOrders, chartData, statusData, lowStockFabrics, recentOrders } = stats;
  const avgMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const handleExport = () => {
    import('../utils/csvExport').then(({ downloadCSV }) => {
      const exportData = [
        { Metric: 'Total Revenue', Value: revenue },
        { Metric: 'Net Profit', Value: profit },
        { Metric: 'Active Orders', Value: activeOrders },
        { Metric: 'Avg Margin', Value: `${avgMargin.toFixed(1)}%` },
        ...chartData.map((d: any) => ({
          Metric: `Trend (${d.name})`,
          Value: `Rev: ${d.revenue}, Prof: ${d.profit}`
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
            Good morning, {stats?.user?.nickname || stats?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
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
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
          trend="up"
          trendValue="12.5%"
          icon={IndianRupee}
          delay={0}
        />
        <KpiCard
          title="Net Profit"
          value={`₹${profit.toLocaleString()}`}
          trend="up"
          trendValue="8.2%"
          icon={TrendingUp}
          delay={100}
        />
        <KpiCard
          title="Active Orders"
          value={activeOrders}
          trend="down"
          trendValue="2.1%"
          icon={ShoppingBag}
          delay={200}
        />
        <KpiCard
          title="Avg. Margin"
          value={`${avgMargin.toFixed(1)}%`}
          trend="up"
          trendValue="1.2%"
          icon={Activity}
          delay={300}
        />
      </div>

      {/* Main Analytics Grid */}
      {(stats.user?.preferences?.dashboard?.revenueChart?.show !== false || stats.user?.preferences?.dashboard?.statusPie?.show !== false) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Trends */}
          {stats.user?.preferences?.dashboard?.revenueChart?.show !== false && (
            <div className={`${stats.user?.preferences?.dashboard?.statusPie?.show === false ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Revenue Trends</h2>
                  <p className="text-xs text-zinc-500">Income vs Profit (7 Days)</p>
                </div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded px-3 py-1 text-zinc-700 outline-none focus:border-zinc-400 cursor-pointer"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /> {/* Emerald-500 */}
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} /> {/* Blue-500 */}
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: 'none', padding: '8px 12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                      cursor={{ stroke: '#e4e4e7' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />

                    {(!stats.user?.preferences?.dashboard?.revenueChart?.type || stats.user?.preferences?.dashboard?.revenueChart?.type === 'area') && (
                      <>
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                        <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                      </>
                    )}

                    {stats.user?.preferences?.dashboard?.revenueChart?.type === 'bar' && (
                      <>
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                        <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Profit" />
                      </>
                    )}

                    {stats.user?.preferences?.dashboard?.revenueChart?.type === 'line' && (
                      <>
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue" />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Profit" />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Production Status */}
          {stats.user?.preferences?.dashboard?.statusPie?.show !== false && (
            <div className={`${stats.user?.preferences?.dashboard?.revenueChart?.show === false ? 'lg:col-span-3' : ''} bg-white p-6 rounded-lg border border-zinc-200 flex flex-col shadow-sm transition-shadow hover:shadow-md`}>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-zinc-900">Production Status</h2>
                <p className="text-xs text-zinc-500">Breakdown by status</p>
              </div>
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      cornerRadius={4}
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '12px', boxShadow: 'none' }}
                      itemStyle={{ color: '#18181b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="block text-2xl font-bold text-zinc-900">{statusData.reduce((acc: any, curr: any) => acc + curr.value, 0)}</span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Orders</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {statusData.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-zinc-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                          order.status === OrderStatus.InProgress ? 'bg-blue-100 text-blue-700' :
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
      </div>
    </div >
  );
};

export default Dashboard;
