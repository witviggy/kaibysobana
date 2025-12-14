
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';

const FabricDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [fabric, setFabric] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stockUpdate, setStockUpdate] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchFabric = async () => {
            try {
                if (!id) return;
                const data = await api.getFabric(id);
                setFabric(data);
                setStockUpdate(Number(data.metersAvailable));
            } catch (error) {
                console.error("Failed to fetch fabric", error);
                addToast("Failed to load fabric details", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFabric();
    }, [id]);

    const handleUpdateStock = async () => {
        try {
            setIsUpdating(true);
            if (!id) return;
            await api.updateStock(id, stockUpdate);
            setFabric({ ...fabric, metersAvailable: stockUpdate });
            addToast("Stock updated successfully!", 'success');
        } catch (error) {
            addToast("Failed to update stock", 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (!id) return;
            await api.deleteFabric(id);
            addToast("Fabric deleted successfully", 'success');
            navigate('/stock');
        } catch (error) {
            addToast("Failed to delete fabric", 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
                <SkeletonLine width="150px" height="24px" />
                <SkeletonCard />
            </div>
        );
    }

    if (!fabric) return <div className="p-10 text-center text-zinc-500 text-sm">Fabric not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/stock')}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Inventory
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/stock/edit/${id}`)}
                        className="text-sm text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                        Edit Fabric
                    </button>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                        Delete Fabric
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-zinc-200 p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-900">{fabric.name}</h1>
                        <p className="text-zinc-500">{fabric.color}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${fabric.metersAvailable < 5 ? 'bg-red-50 text-red-700 border-red-100' :
                        fabric.metersAvailable < 10 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-zinc-50 text-zinc-500 border-zinc-200'
                        }`}>
                        {fabric.metersAvailable < 10 ? (fabric.metersAvailable < 5 ? 'Critical Stock' : 'Low Stock') : 'In Stock'}
                    </span>
                </div>

                {fabric.imageUrl && (
                    <div className="mb-8 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 h-64 sm:h-80">
                        <img src={getMediaUrl(fabric.imageUrl)} alt={fabric.name} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div className="p-4 bg-zinc-50 rounded-md border border-zinc-100">
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Current Stock</label>
                        <div className="text-xl font-semibold text-zinc-900 mt-1">{fabric.metersAvailable} m</div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-md border border-zinc-100">
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Price per Meter</label>
                        <div className="text-xl font-semibold text-zinc-900 mt-1">₹{fabric.pricePerMeter}</div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-md border border-zinc-100">
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Consumption Rate</label>
                        <div className="text-base font-medium text-zinc-900 mt-1">{fabric.metersPerOutfit} m / outfit</div>
                    </div>
                </div>

                <div className="border-t border-zinc-100 pt-6">
                    <h3 className="font-medium text-zinc-900 mb-4">Update Stock</h3>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            value={stockUpdate}
                            onChange={(e) => setStockUpdate(parseFloat(e.target.value))}
                            className="w-32 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                        />
                        <button
                            onClick={handleUpdateStock}
                            disabled={isUpdating}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {isUpdating ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Update
                        </button>
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Fabric"
                message="Are you sure you want to delete this fabric from inventory? This action cannot be undone."
                isDestructive
            />
        </div>
    );
};

export default FabricDetail;
