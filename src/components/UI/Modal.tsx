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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-black tracking-tight">{title}</h2>
                        <button
                            onClick={onClose}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
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
