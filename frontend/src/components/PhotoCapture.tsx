import React, { useState, useRef } from 'react';
import { Camera, Upload, X, ImageIcon, Maximize2 } from 'lucide-react';
import { getMediaUrl } from '../services/api';

interface PhotoCaptureProps {
    onImageSelected: (file: File) => void;
    currentImageUrl?: string;
    label?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onImageSelected, currentImageUrl, label = "Image (Optional)" }) => {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreview(URL.createObjectURL(file));
            onImageSelected(file);
        }
    };

    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera", err);
            alert("Could not access camera");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setPreview(URL.createObjectURL(file));
                        onImageSelected(file);
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };

    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-1.5">
            {isCameraOpen ? (
                <div className="relative w-full rounded-lg overflow-hidden shadow-md border border-zinc-200">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto bg-black" />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                            <div className="w-9 h-9 rounded-full border-2 border-zinc-900 bg-transparent" />
                        </button>
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            ) : preview ? (
                <div className="relative group w-full h-36 rounded-lg overflow-hidden border border-zinc-200">
                    <img src={getMediaUrl(preview)} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => setIsPreviewOpen(true)} className="p-1.5 bg-white rounded-full text-zinc-700 hover:bg-zinc-50 shadow-sm" title="Preview">
                            <Maximize2 size={16} />
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-white rounded-full text-zinc-600 hover:bg-zinc-50 shadow-sm" title="Replace">
                            <Upload size={16} />
                        </button>
                        <button type="button" onClick={clearImage} className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-sm" title="Remove">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-300 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400 transition-all cursor-pointer"
                >
                    <div className="w-9 h-9 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400">
                        <ImageIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-700">{label}</p>
                        <p className="text-xs text-zinc-400">Click to upload or <button type="button" onClick={(e) => { e.stopPropagation(); startCamera(); }} className="text-blue-600 hover:underline">use camera</button></p>
                    </div>
                    <Upload size={16} className="text-zinc-400 flex-shrink-0" />
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Full-screen Image Preview Lightbox */}
            {isPreviewOpen && preview && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsPreviewOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={getMediaUrl(preview)}
                        alt="Full preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default PhotoCapture;
