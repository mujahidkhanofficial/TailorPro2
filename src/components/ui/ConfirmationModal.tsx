import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { db } from '@/db/database';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    requirePassword?: boolean;
}

import { createPortal } from 'react-dom';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = true,
    isLoading = false,
    requirePassword = false,
}: ConfirmationModalProps) {
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
            setVerifying(false);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (requirePassword) {
            if (!password) {
                setError(isUrdu ? 'پاس ورڈ درج کریں' : 'Password is required');
                return;
            }
            setVerifying(true);
            try {
                const settings = await db.settings.toCollection().first();
                const correctPassword = settings?.password || 'admin123';
                if (password === correctPassword) {
                    onConfirm();
                } else {
                    setError(isUrdu ? 'غلط پاس ورڈ' : 'Incorrect Password');
                    setVerifying(false);
                }
            } catch (err) {
                console.error('Password verify error:', err);
                setError('Verification Error');
                setVerifying(false);
            }
        } else {
            onConfirm();
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {message}
                    </p>

                    {requirePassword && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isUrdu ? 'تصدیق کے لیے پاس ورڈ درج کریں' : 'Enter Password to Confirm'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className={`input w-full ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                                placeholder="••••••••"
                                autoFocus
                            />
                            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading || verifying}
                            className="btn btn-secondary flex-1"
                        >
                            {cancelText || t('common.cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`btn flex-1 flex items-center justify-center gap-2 ${isDestructive
                                ? 'btn-danger'
                                : 'btn-primary'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                confirmText || t('common.delete')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
