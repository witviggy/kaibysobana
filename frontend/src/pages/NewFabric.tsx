import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Info } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import PhotoCapture from '../components/PhotoCapture';
import { useToast } from '../context/ToastContext';

const NewFabric: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [formData, setFormData] = useState({
        name: '',
        color: '',
        metersAvailable: 0,
        metersPerOutfit: 2,
        pricePerMeter: 0,
        status: 'In Stock',
        imageUrl: ''
    });

    useEffect(() => {
        if (isEditing && id) {
            const fetchFabric = async () => {
                try {
                    const data = await api.getFabric(id);
                    setFormData({
                        name: data.name,
                        color: data.color,
                        metersAvailable: Number(data.metersAvailable),
                        metersPerOutfit: Number(data.metersPerOutfit),
                        pricePerMeter: Number(data.pricePerMeter),
                        status: data.status,
                        imageUrl: data.imageUrl || ''
                    });
                } catch (error) {
                    console.error("Failed to fetch fabric", error);
                    addToast("Failed to load fabric details", 'error');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFabric();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing && id) {
                await api.updateFabric(id, formData);
                addToast("Fabric updated successfully", 'success');
            } else {
                await api.createFabric(formData);
                addToast("Fabric added successfully", 'success');
            }
            setTimeout(() => {
                navigate('/stock');
            }, 500);
        } catch (error) {
            console.error(error);
            addToast("Failed to save fabric", 'error');
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center text-zinc-500">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/stock')}
                    className="p-2 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{isEditing ? 'Edit Fabric' : 'Add New Fabric'}</h1>
                    <p className="text-sm text-zinc-500">{isEditing ? 'Update inventory details.' : 'Register new inventory.'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Info Card */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8">
                        <h3 className="text-base font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-2">
                            Material Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Fabric Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Silk Charmeuse"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Color Variant</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ivory"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock & Costing Card */}
                    <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8">
                        <h3 className="text-base font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-2">
                            Inventory & Pricing
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Initial Stock</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        min="0"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 pr-8"
                                        value={formData.metersAvailable}
                                        onChange={e => setFormData({ ...formData, metersAvailable: parseFloat(e.target.value) })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">m</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Price / Meter</label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    min="0"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                    value={formData.pricePerMeter}
                                    onChange={e => setFormData({ ...formData, pricePerMeter: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Usage / Outfit</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        min="0"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 pr-8"
                                        value={formData.metersPerOutfit}
                                        onChange={e => setFormData({ ...formData, metersPerOutfit: parseFloat(e.target.value) })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">m</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Fabric Image</label>
                            <div className="bg-white p-4 rounded-md border border-zinc-200">
                                <PhotoCapture
                                    label="Upload or Capture Fabric Image"
                                    currentImageUrl={formData.imageUrl}
                                    onImageSelected={async (file) => {
                                        try {
                                            const { url } = await api.uploadImage(file);
                                            setFormData(prev => ({ ...prev, imageUrl: url }));
                                        } catch (e) {
                                            alert("Failed to upload image");
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar / Preview */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 rounded-lg shadow-sm p-6 text-white">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Info size={16} className="text-zinc-400" />
                            Preview
                        </h3>

                        <div className="bg-zinc-800 rounded-md p-4 border border-zinc-700">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Fabric</p>
                            <p className="text-lg font-bold text-white truncate">{formData.name || 'New Fabric'}</p>
                            <p className="text-xs text-zinc-400 mt-1">{formData.color || 'Color'}</p>

                            {formData.imageUrl && (
                                <div className="mt-3 rounded-md overflow-hidden aspect-video relative bg-zinc-900 border border-zinc-700">
                                    <img src={getMediaUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Total Value</p>
                                    <p className="text-sm font-bold text-white">₹{(formData.metersAvailable * formData.pricePerMeter).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Yield</p>
                                    <p className="text-sm font-bold text-white">
                                        ~{formData.metersPerOutfit > 0 ? Math.floor(formData.metersAvailable / formData.metersPerOutfit) : 0} units
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 py-2 bg-white text-zinc-900 rounded-md font-bold text-sm hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Fabric' : 'Save Fabric')}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default NewFabric;
