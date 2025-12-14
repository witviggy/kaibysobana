
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Scissors, AlertCircle, ArrowUpRight, Package, IndianRupee, Download } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const FabricStock: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [fabrics, setFabrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchFabrics = async () => {
            try {
                const data = await api.getFabrics();
                setFabrics(data);
            } catch (error) {
                console.error("Failed to fetch fabrics", error);
                addToast("Failed to load fabric inventory", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFabrics();
    }, [addToast]);

    const filteredFabrics = fabrics.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.id && f.id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const lowStockCount = fabrics.filter(f => f.metersAvailable < 10).length;
    const totalValue = fabrics.reduce((acc, curr) => acc + (curr.metersAvailable * curr.pricePerMeter), 0);

    const handleExport = () => {
        import('../utils/csvExport').then(({ downloadCSV }) => {
            const dataToExport = filteredFabrics.map(f => ({
                ID: f.id,
                Name: f.name,
                Color: f.color,
                'Meters Available': f.metersAvailable,
                'Price/Meter': f.pricePerMeter,
                'Value': f.metersAvailable * f.pricePerMeter,
                Status: f.status,
                'Last Updated': f.lastUpdated
            }));
            downloadCSV(dataToExport, `Fabric_Inventory_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const getColorClass = (color: string) => {
        // ... (existing logic)
        const c = color.toLowerCase();
        if (c.includes('red') || c.includes('burgundy')) return 'bg-red-500';
        if (c.includes('blue') || c.includes('navy')) return 'bg-blue-500';
        if (c.includes('green') || c.includes('emerald')) return 'bg-emerald-500';
        if (c.includes('yellow') || c.includes('gold')) return 'bg-yellow-500';
        if (c.includes('purple')) return 'bg-purple-500';
        if (c.includes('pink') || c.includes('rose')) return 'bg-pink-500';
        if (c.includes('black') || c.includes('charcoal')) return 'bg-zinc-800';
        if (c.includes('white') || c.includes('ivory')) return 'bg-zinc-100 border border-zinc-200';
        if (c.includes('gray') || c.includes('grey')) return 'bg-zinc-500';
        return 'bg-zinc-300';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Fabric Stock</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage inventory and materials.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={() => navigate('/stock/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-all shadow-sm"
                    >
                        <Plus size={16} /> Add Fabric
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Materials</p>
                            <p className="text-2xl font-semibold text-zinc-900">{fabrics.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Low Stock</p>
                            <p className="text-2xl font-semibold text-zinc-900">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center text-zinc-500">
                            <IndianRupee size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Value</p>
                            <p className="text-2xl font-semibold text-zinc-900">₹{totalValue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search fabrics by name or color..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-md bg-white border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {/* Fabric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : filteredFabrics.length > 0 ? (
                    filteredFabrics.map((fabric) => (
                        <div
                            key={fabric.id}
                            onClick={() => navigate(`/stock/${fabric.id}`)}
                            className="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all cursor-pointer group overflow-hidden flex flex-col hover:shadow-sm"
                        >
                            {/* Color Swatch / Image Header */}
                            <div className="h-40 bg-zinc-100 relative flex items-center justify-center overflow-hidden">
                                {fabric.imageUrl ? (
                                    <img src={getMediaUrl(fabric.imageUrl)} alt={fabric.name} className="w-full h-full object-cover" />
                                ) : (
                                    /* Use a simple circle for color instead of full background to keep it clean */
                                    <div className={`w-16 h-16 rounded-full shadow-sm ${getColorClass(fabric.color)}`} />
                                )}

                                {fabric.metersAvailable < 5 ? (
                                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                        CRITICAL
                                    </div>
                                ) : fabric.metersAvailable < 10 ? (
                                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                        LOW STOCK
                                    </div>
                                ) : null}
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-3">
                                    <h3 className="font-semibold text-zinc-900 group-hover:text-black transition-colors">{fabric.name}</h3>
                                    <p className="text-sm text-zinc-500">{fabric.color}</p>
                                </div>

                                <div className="mt-auto space-y-2 pt-3 border-t border-zinc-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500">Available</span>
                                        <span className={`font-medium ${fabric.metersAvailable < 5 ? 'text-red-600' : fabric.metersAvailable < 10 ? 'text-amber-600' : 'text-zinc-900'}`}>
                                            {fabric.metersAvailable} m
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500">Price / m</span>
                                        <span className="font-medium text-zinc-900">₹{fabric.pricePerMeter}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        <p>No fabrics found.</p>
                        <button
                            onClick={() => navigate('/stock/new')}
                            className="mt-4 text-sm font-medium text-zinc-900 underline hover:text-black"
                        >
                            Add New Fabric
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FabricStock;
