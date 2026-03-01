import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, X, ShoppingBag } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import PhotoCapture from '../components/PhotoCapture';

const Catalog: React.FC = () => {
    const { addToast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [fabrics, setFabrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal & Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        defaultFabricId: '',
        basePrice: 0,
        description: '',
        imageUrl: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsData, fabricsData] = await Promise.all([
                api.getProducts(),
                api.getFabrics()
            ]);
            setProducts(productsData);
            setFabrics(fabricsData);
        } catch (error) {
            console.error(error);
            addToast("Failed to load catalog", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, formData);
                addToast("Product updated", 'success');
            } else {
                await api.createProduct(formData);
                addToast("Product created", 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast("Failed to save product", 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure?")) {
            try {
                await api.deleteProduct(id);
                addToast("Product deleted", 'success');
                fetchData();
            } catch (error) {
                addToast("Failed to delete", 'error');
            }
        }
    };

    const openModal = (product: any = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                defaultFabricId: product.default_fabric_id || '',
                basePrice: Number(product.base_price),
                description: product.description || '',
                imageUrl: product.imageUrl || product.image_url || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                defaultFabricId: '',
                basePrice: 0,
                description: '',
                imageUrl: ''
            });
        }
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="p-8 text-center text-zinc-500">Loading Catalog...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Dress Catalog</h1>
                    <p className="text-sm text-zinc-500">Manage dress types and default fabrics.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
                >
                    <Plus size={16} /> New Dress
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg border border-zinc-200 flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                        {/* Product Image */}
                        <div className="h-36 bg-zinc-100 relative flex items-center justify-center overflow-hidden">
                            {(product.imageUrl || product.image_url) ? (
                                <img src={getMediaUrl(product.imageUrl || product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag size={32} className="text-zinc-300" />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button onClick={() => openModal(product)} className="p-1.5 bg-white/90 rounded-md text-zinc-500 hover:text-zinc-700 shadow-sm">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-white/90 rounded-md text-red-400 hover:text-red-600 shadow-sm">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-semibold text-zinc-900 text-lg">{product.name}</h3>
                            <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{product.description || 'No description'}</p>

                            <div className="mt-auto pt-4 border-t border-zinc-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Default Fabric:</span>
                                    <span className="font-medium text-zinc-900">{product.defaultFabricName || 'None'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Base Price:</span>
                                    <span className="font-medium text-zinc-900">₹{product.base_price}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-semibold text-zinc-900">{editingProduct ? 'Edit Dress' : 'Add New Dress'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Dress Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    placeholder="e.g. Anarkali, Maxi Dress"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Default Fabric</label>
                                <select
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    value={formData.defaultFabricId}
                                    onChange={e => setFormData({ ...formData, defaultFabricId: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {fabrics.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.color})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Base Price (Optional)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    value={formData.basePrice}
                                    onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    rows={2}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <PhotoCapture
                                label="Product Image (Optional)"
                                currentImageUrl={formData.imageUrl}
                                onImageSelected={async (file) => {
                                    try {
                                        const { url } = await api.uploadImage(file);
                                        setFormData(prev => ({ ...prev, imageUrl: url }));
                                    } catch (e) {
                                        console.error('Upload failed', e);
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-md text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black">Save</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Catalog;
