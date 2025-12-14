
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Card */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md border border-zinc-200 overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, isDestructive = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-zinc-600 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'
                        }`}
                >
                    Confirm
                </button>
            </div>
        </Modal>
    );
};
