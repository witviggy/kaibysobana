import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { getMediaUrl } from '../services/api';

interface PhotoCaptureProps {
    onImageSelected: (file: File) => void;
    currentImageUrl?: string;
    label?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onImageSelected, currentImageUrl, label = "Upload Image" }) => {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
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
        <div className="space-y-3">
            <span className="block text-sm font-medium text-zinc-700">{label}</span>

            <div className="relative border-2 border-dashed border-zinc-300 rounded-lg p-6 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors">
                {isCameraOpen ? (
                    <div className="relative w-full max-w-sm rounded overflow-hidden shadow-lg">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto bg-black" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={capturePhoto}
                                className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-transparent" />
                            </button>
                            <button
                                type="button"
                                onClick={stopCamera}
                                className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                ) : preview ? (
                    <div className="relative group w-full max-w-[200px] h-[200px]">
                        <img src={getMediaUrl(preview)} alt="Preview" className="w-full h-full object-cover rounded-md border border-zinc-200 shadow-sm" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
                            <button type="button" onClick={clearImage} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-zinc-200 transition-colors">
                                    <Upload size={24} className="text-zinc-600" />
                                </div>
                                <span className="text-xs font-semibold text-zinc-600">Upload File</span>
                            </button>

                            <button
                                type="button"
                                onClick={startCamera}
                                className="flex flex-col items-center gap-2 p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-zinc-200 transition-colors">
                                    <Camera size={24} className="text-zinc-600" />
                                </div>
                                <span className="text-xs font-semibold text-zinc-600">Use Camera</span>
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500">Supports JPG, PNG (Max 5MB)</p>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default PhotoCapture;
