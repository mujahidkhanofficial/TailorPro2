import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkerStore } from '@/stores/workerStore';
import { Worker, WorkerRole } from '@/db/database';
import toast from 'react-hot-toast';

interface WorkerFormModalProps {
    worker?: Worker | null;
    onClose: () => void;
    onSuccess?: (workerId: number) => void;
}

import { createPortal } from 'react-dom';

export default function WorkerFormModal({ worker, onClose, onSuccess }: WorkerFormModalProps) {
    const { t } = useTranslation();
    const { addWorker, updateWorker, workers } = useWorkerStore();
    const isEditing = Boolean(worker?.id);

    const [formData, setFormData] = useState({
        name: worker?.name || '',
        phone: worker?.phone || '',
        role: worker?.role || 'karigar' as WorkerRole,
        isActive: worker?.isActive ?? true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const validatePhone = (phone: string): boolean => {
        // Must be digits only
        if (!/^\d+$/.test(phone)) return false;

        // Pakistani mobile: 11 digits starting with 03
        const mobilePattern = /^03\d{9}$/;
        // Landline: Usually 10-11 digits starting with 0
        const landlinePattern = /^0\d{9,10}$/;

        return mobilePattern.test(phone) || landlinePattern.test(phone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('workers.nameRequired');
        }

        if (formData.phone && formData.phone.trim()) {
            if (!validatePhone(formData.phone)) {
                newErrors.phone = t('validation.invalidPhone');
            } else {
                // Check uniqueness
                const existing = workers.find(w => w.phone === formData.phone && w.id !== worker?.id);
                if (existing) {
                    newErrors.phone = t('validation.phoneExists');
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            if (isEditing && worker?.id) {
                await updateWorker(worker.id, formData);
                toast.success(t('common.updateSuccess'));
            } else {
                const id = await addWorker(formData);
                toast.success(t('common.addSuccess'));
                if (onSuccess) onSuccess(id);
            }
            onClose();
        } catch (error) {
            console.error('Error saving worker:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const roles: WorkerRole[] = ['cutter', 'checker', 'karigar'];

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? t('workers.editWorker') : t('workers.addNew')}
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('workers.name')} *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`input ${errors.name ? 'border-red-500' : ''}`}
                            placeholder={t('workers.namePlaceholder')}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('workers.phone')}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, phone: value });
                            }}
                            className={`input ${errors.phone ? 'border-red-500' : ''}`}
                            placeholder="03XXXXXXXXX"
                            dir="ltr"
                        />
                        {errors.phone && (
                            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('workers.role')} *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${formData.role === role
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                                        }`}
                                >
                                    {t(`workers.roles.${role}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            {t('workers.activeStatus')}
                        </label>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
