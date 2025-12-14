
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Camera } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';
import { Status } from '../types';
import PhotoCapture from '../components/PhotoCapture';

const ClientForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        avatarUrl: '',
        status: Status.Active
    });

    useEffect(() => {
        if (isEditing) {
            const fetchClient = async () => {
                try {
                    const data = await api.getClient(id);
                    setFormData({
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        address: data.address,
                        avatarUrl: data.avatarUrl || '',
                        status: data.status
                    });
                } catch (error: any) {
                    console.error("Failed to fetch client", error);
                    addToast("Failed to load client details.", 'error');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClient();
        }
    }, [id, isEditing, addToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await api.updateClient(id, formData);
                addToast("Client updated successfully", 'success');
            } else {
                await api.createClient(formData);
                addToast("Client added successfully", 'success');
            }
            setTimeout(() => {
                navigate('/clients');
            }, 500);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || `Failed to ${isEditing ? 'update' : 'create'} client`, 'error');
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-pulse">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-zinc-100 rounded-md"></div>
                <div className="space-y-2">
                    <SkeletonLine width="150px" height="28px" />
                    <SkeletonLine width="250px" height="16px" />
                </div>
            </div>
            <SkeletonCard />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/clients')}
                    className="p-2 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
                        {isEditing ? 'Edit Client' : 'Add New Client'}
                    </h1>
                    <p className="text-sm text-zinc-500">
                        {isEditing ? 'Update customer information.' : 'Register a new customer.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Main Info Card */}
                <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 transition-shadow hover:shadow-sm">
                    <h3 className="text-base font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-2 flex items-center gap-2">
                        <User size={16} className="text-zinc-500" /> Basic Information
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Sobana"
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Mail size={14} className="text-zinc-400" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="sobana@example.com"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Phone size={14} className="text-zinc-400" /> Contact Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+91 98765 43210"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                <MapPin size={14} className="text-zinc-400" /> Shipping Address
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Full address including pin code"
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                <Camera size={14} className="text-zinc-400" /> Profile Photo
                            </label>
                            <div className="bg-white p-4 rounded-md border border-zinc-200">
                                <PhotoCapture
                                    label="Upload or Capture Photo"
                                    currentImageUrl={formData.avatarUrl}
                                    onImageSelected={async (file) => {
                                        try {
                                            const { url } = await api.uploadImage(file);
                                            setFormData(prev => ({ ...prev, avatarUrl: url }));
                                        } catch (e) {
                                            alert("Failed to upload image");
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-md font-medium text-sm hover:bg-black transition-colors disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {isSubmitting ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default ClientForm;
