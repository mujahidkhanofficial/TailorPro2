import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '@/stores/customerStore';
import { Customer } from '@/db/database';

interface CustomerFormModalProps {
    customer?: Customer | null;
    onClose: () => void;
    onSuccess?: (customerId: number) => void;
    onSaveAndMeasure?: (customerId: number) => void;
}

import { createPortal } from 'react-dom';

export default function CustomerFormModal({ customer, onClose, onSuccess, onSaveAndMeasure }: CustomerFormModalProps) {
    const { t } = useTranslation();
    const { addCustomer, updateCustomer } = useCustomerStore();

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        id: customer?.id?.toString() || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Escape key to close modal
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

    const handleSubmit = async (e: React.FormEvent | null, shouldRedirect: boolean = false) => {
        if (e) e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('validation.required');
        }

        if (!formData.phone.trim()) {
            newErrors.phone = t('validation.required');
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = t('validation.invalidPhone');
        }

        // Validate Manual ID if provided
        if (formData.id && !customer) {
            const manualId = parseInt(formData.id);
            if (isNaN(manualId) || manualId <= 0) {
                newErrors.id = t('validation.invalidId');
            } else {
                // Check if ID exists
                const existing = await useCustomerStore.getState().customers.find(c => c.id === manualId);
                if (existing) {
                    newErrors.id = t('validation.idExists');
                }
            }
        }

        // Check phone uniqueness
        if (formData.phone.trim()) {
            const customers = useCustomerStore.getState().customers;
            const existing = customers.find(c => c.phone === formData.phone && c.id !== customer?.id);
            if (existing) {
                newErrors.phone = t('validation.phoneExists');
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            let savedId: number;

            if (customer?.id) {
                await updateCustomer(customer.id, {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                });
                savedId = customer.id;
            } else {
                // Prepare new customer data
                const newCustomerData: any = {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                };

                // Add manual ID if provided
                if (formData.id) {
                    newCustomerData.id = parseInt(formData.id);
                }

                savedId = await addCustomer(newCustomerData);
            }

            if (onSuccess) onSuccess(savedId);

            if (shouldRedirect && onSaveAndMeasure) {
                onSaveAndMeasure(savedId);
            } else {
                onClose();
            }

        } catch (error: any) {
            console.error('Error saving customer:', error);
            if (error.name === 'ConstraintError' || error.message?.includes('Key already exists')) {
                setErrors(prev => ({ ...prev, id: t('validation.idExists') }));
            } else {
                setErrors(prev => ({ ...prev, form: t('common.error') }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6">
                        {customer ? t('common.edit') : t('customers.addNew')}
                    </h2>

                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                        {/* Manual ID (Only for new customers) */}
                        {!customer && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('customers.customerId')}
                                </label>
                                <input
                                    type="number"
                                    value={formData.id}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                                    className={`input ${errors.id ? 'border-red-500' : ''}`}
                                    placeholder={t('customers.idPlaceholder')}
                                />
                                {errors.id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.id}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('customers.idHelper')}
                                </p>
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('customers.name')} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                className={`input ${errors.name ? 'border-red-500' : ''}`}
                                placeholder="Muhammad Ali"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('customers.phone')} *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setFormData((prev) => ({ ...prev, phone: value }));
                                }}
                                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                                placeholder="03XXXXXXXXX"
                                dir="ltr"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('customers.address')}
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                className="input"
                                rows={2}
                                placeholder=""
                            />
                        </div>

                        {/* Error Message */}
                        {errors.form && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                {errors.form}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            {!customer && (
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(null, true)}
                                    disabled={isSubmitting}
                                    className="btn btn-success flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        t('customers.saveAndAddMeasurements')
                                    )}
                                </button>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary flex-1">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t('common.loading')}
                                        </>
                                    ) : (
                                        t('common.save')
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
