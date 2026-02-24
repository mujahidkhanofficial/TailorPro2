import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { db, Customer, Worker } from '@/db/database';
import { addDays, toInputDateFormat } from '@/utils/formatters';
import { Check, Plus, Calendar, ArrowLeft, ChevronDown, Printer } from 'lucide-react';
import CustomerFormModal from '@/components/forms/CustomerFormModal';
import PageTransition from '@/components/ui/PageTransition';
import { usePrinter } from '@/hooks/usePrinter';
import { generateMeasurementSlipHTML } from '@/utils/printHelpers';

export default function CreateOrder() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addOrder } = useOrderStore();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [activeWorkers, setActiveWorkers] = useState<Worker[]>([]);

    // Initial state setup needs to handle query 'customerId'
    const initialCustomerId = Number(searchParams.get('customerId')) || 0;

    const [formData, setFormData] = useState({
        customerId: initialCustomerId,
        dueDate: toInputDateFormat(addDays(new Date(), 3)),
        advancePayment: '',
        deliveryNotes: '',
        suitsCount: 1,
        cutterId: 0,
        checkerId: 0,
        karigarId: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [customerSearch, setCustomerSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);



    // Print State
    const { printSlip } = usePrinter();

    useEffect(() => {
        loadData();
    }, []);

    // Set search text if we have an initial customer ID
    useEffect(() => {
        if (initialCustomerId && customers.length > 0) {
            const c = customers.find(cust => cust.id === initialCustomerId);
            if (c) {
                setCustomerSearch(c.name);
            }
        }
    }, [customers, initialCustomerId]);

    async function loadData() {
        const allCustomers = await db.customers.toArray();
        setCustomers(allCustomers);

        const allWorkers = await db.workers.toArray();
        const activeWorkers = allWorkers.filter(w => w.isActive);
        setActiveWorkers(activeWorkers);
    }

    const filteredCustomers = useMemo(() => customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.phone.includes(customerSearch)
    ), [customers, customerSearch]);

    // Get selected customer info
    const selectedCustomer = customers.find((c) => c.id === formData.customerId);

    const handleSubmit = async (e: React.FormEvent, shouldPrint = false) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};

        if (!formData.customerId) {
            newErrors.customerId = t('validation.required');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setIsSubmitting(true);

            const orderId = await addOrder({
                customerId: formData.customerId,
                status: 'new',
                dueDate: new Date(formData.dueDate),
                advancePayment: formData.advancePayment || undefined,
                suitsCount: formData.suitsCount,
                deliveryNotes: formData.deliveryNotes || undefined,
                cutterId: formData.cutterId || undefined,
                checkerId: formData.checkerId || undefined,
                karigarId: formData.karigarId || undefined,
            });

            if (shouldPrint) {
                // Fetch data needed for printing
                const customer = await db.customers.get(formData.customerId);
                const measurement = await db.customerMeasurements.where('customerId').equals(formData.customerId).first();
                const settings = await db.settings.get(1);

                // Fetch Workers
                const cutter = formData.cutterId ? await db.workers.get(formData.cutterId) : undefined;
                const checker = formData.checkerId ? await db.workers.get(formData.checkerId) : undefined;
                const karigar = formData.karigarId ? await db.workers.get(formData.karigarId) : undefined;

                const workerNames = {
                    cutter: cutter?.name,
                    checker: checker?.name,
                    karigar: karigar?.name
                };

                const savedOrder = await db.orders.get(orderId);

                if (customer && measurement && savedOrder) {
                    const html = generateMeasurementSlipHTML(customer, measurement, settings, workerNames, savedOrder);
                    await printSlip(html);
                }
                navigate('/orders');
            } else {
                navigate('/orders');
            }
        } catch (error) {
            console.error('Error creating order:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAndPrint = (e: React.FormEvent) => {
        handleSubmit(e, true);
    };

    return (
        <PageTransition className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/orders" className="btn btn-secondary p-2 rounded-full w-10 h-10 flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{t('orders.addNew')}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6 w-full">

                        {/* Customer Section */}
                        <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">{t('customers.title')}</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('orders.selectCustomer')} *
                                </label>
                                {customers.length === 0 ? (
                                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4 border border-yellow-200">
                                        <p className="font-medium mb-1">{t('customers.noCustomersFound')}</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomerModalOpen(true)}
                                            className="text-primary-600 font-medium hover:underline flex items-center gap-1 mt-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('customers.addNewButton')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="input mb-2"
                                            placeholder={t('customers.search')}
                                            // Clear selection if user types
                                            onFocus={() => {
                                                if (formData.customerId) {
                                                    setFormData(prev => ({ ...prev, customerId: 0 }));
                                                    setCustomerSearch('');
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                                            <Plus className="w-5 h-5 opacity-0" /> {/* Spacer */}
                                        </div>
                                    </div>
                                )}

                                {customerSearch && !formData.customerId && (
                                    <div className="border rounded-lg max-h-60 overflow-y-auto mb-4 bg-white shadow-sm z-10 relative">
                                        {filteredCustomers.slice(0, 50).map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, customerId: c.id! }));
                                                    setCustomerSearch(c.name);
                                                    setErrors(prev => ({ ...prev, customerId: '' }));
                                                }}
                                                className="w-full text-start p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{c.name}</p>
                                                        <p className="text-sm text-gray-500">{c.phone}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                        #{c.id}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}

                                        {filteredCustomers.length > 50 && (
                                            <div className="p-2 text-center text-xs text-gray-400 bg-gray-50 border-t">
                                                {t('customers.showingTopResults', { count: 50, total: filteredCustomers.length })}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setIsCustomerModalOpen(true)}
                                            className="w-full text-start p-3 hover:bg-primary-50 text-primary-600 flex items-center gap-2 font-medium border-t"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>{t('customers.createWithName', { name: customerSearch })}</span>
                                        </button>
                                    </div>
                                )}

                                {formData.customerId > 0 && selectedCustomer && (
                                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex justify-between items-center animate-fadeIn">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{selectedCustomer.name}</p>
                                                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <span className="text-xs font-bold text-primary-700 bg-primary-200/50 px-2 py-1 rounded block mb-1">
                                                ID: {selectedCustomer.id}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, customerId: 0 }));
                                                    setCustomerSearch('');
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                            >
                                                {t('common.change')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {errors.customerId && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {errors.customerId}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline-block me-1 text-gray-400" />
                                    {t('orders.dueDate')}
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                                    className="input h-11"
                                    dir="ltr" // Force LTR for calling browser date picker
                                />
                            </div>

                            {/* Advance Payment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('orders.advancePayment')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.advancePayment}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, advancePayment: e.target.value }))}
                                    className="input h-11"
                                    placeholder={t('orders.paymentPlaceholder')}
                                />
                            </div>
                        </div>

                        {/* Suits Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('orders.suitsQuantity')}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.suitsCount}
                                onChange={(e) => setFormData((prev) => ({ ...prev, suitsCount: Number(e.target.value) }))}
                                className="input h-11"
                            />
                        </div>

                        {/* Delivery Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('orders.deliveryNotes')}
                            </label>
                            <textarea
                                value={formData.deliveryNotes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNotes: e.target.value }))}
                                className="input"
                                rows={3}
                                placeholder={t('orders.notesPlaceholder')}
                            />
                        </div>

                        {/* Worker Assignment Section */}
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('workers.assignment')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Cutter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('workers.cutter')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.cutterId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cutterId: Number(e.target.value) || 0 }))}
                                            className="input py-2.5 appearance-none w-full rtl:pl-10 ltr:pr-10 !font-sans !leading-normal text-center"
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {activeWorkers.filter(w => w.role === 'cutter').map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 pointer-events-none text-gray-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Checker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('workers.checker')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.checkerId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, checkerId: Number(e.target.value) || 0 }))}
                                            className="input py-2.5 appearance-none w-full rtl:pl-10 ltr:pr-10 !font-sans !leading-normal text-center"
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {activeWorkers.filter(w => w.role === 'checker').map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 pointer-events-none text-gray-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Karigar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('workers.karigar')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.karigarId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, karigarId: Number(e.target.value) || 0 }))}
                                            className="input py-2.5 appearance-none w-full rtl:pl-10 ltr:pr-10 !font-sans !leading-normal text-center"
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {activeWorkers.filter(w => w.role === 'karigar').map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 pointer-events-none text-gray-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-8 border-t mt-8">
                            <Link to="/orders" className="btn btn-secondary flex-1 text-center flex items-center justify-center">
                                {t('common.cancel')}
                            </Link>
                            <button
                                type="button"
                                onClick={handleSaveAndPrint}
                                disabled={isSubmitting || !formData.customerId}
                                className="btn btn-success flex-1 flex items-center justify-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                {t('common.saveAndPrint')}
                            </button>
                            <button type="submit" disabled={isSubmitting || !formData.customerId} className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-lg">
                                {isSubmitting ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        {t('common.save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>


                </div>
            </div>

            {isCustomerModalOpen && (
                <CustomerFormModal
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={async (newCustomerId) => {
                        await loadData();
                        const newCustomer = await db.customers.get(newCustomerId);
                        if (newCustomer) {
                            setFormData((prev) => ({ ...prev, customerId: newCustomerId }));
                            setCustomerSearch(newCustomer.name);
                        }
                    }}
                />
            )}
        </PageTransition>
    );
}
