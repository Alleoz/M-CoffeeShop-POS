"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className={`modal-content w-[95vw] sm:w-[90vw] ${maxWidth}`}>
                <div className="bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                        <h2 className="text-lg font-extrabold tracking-tight text-text-primary">{title}</h2>
                        <button
                            onClick={onClose}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-bg-muted text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
