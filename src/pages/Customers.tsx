import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '@/stores/customerStore';
import { Customer } from '@/db/database';
import CustomerFormModal from '@/components/forms/CustomerFormModal';
import { Plus, Search, Users, History, Edit2, Trash2, Ruler, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';

import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function Customers() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customers, loading, searchQuery, loadCustomers, setSearchQuery, deleteCustomer } = useCustomerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    // Modal Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        loadCustomers();

        const handleKeyDown = (e: KeyboardEvent) => {
            // New Customer: Ctrl + N
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                handleAddNew();
            }
            // Focus Search: Ctrl + K
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('customer-search')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchQuery]);

    const handleAddNew = () => {
        setEditingCustomer(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteCustomer(deleteId);
            toast.success(t('common.deleteSuccess'));
            setDeleteId(null);
        }
    };

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('customers.title')} <span className="text-gray-500 text-lg font-medium">({customers.length})</span>
                </h1>
                <div className="flex gap-2">

                    <button onClick={handleAddNew} className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        {t('customers.addNew')}
                    </button>
                </div>
            </div>



            {/* Customer List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : customers.length === 0 ? (
                <div className="text-center py-12 card flex flex-col items-center">
                    <div className="transform scale-150 mb-4 opacity-50"><Users className="w-24 h-24 text-gray-200" /></div>
                    <p className="text-gray-500 text-lg">{t('customers.noCustomers')}</p>
                    <button onClick={handleAddNew} className="btn btn-primary mt-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        {t('customers.addNew')}
                    </button>
                </div>
            ) : (
                <>
                    {/* Search Box - Same grid as cards for matching width */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 border-b-4 border-b-gray-300 bg-white shadow-sm">
                            <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0 border-b-4 border-b-gray-950">
                                <Search className="w-5 h-5 text-white" />
                            </div>
                            <input
                                id="customer-search"
                                type="text"
                                placeholder={t('customers.search')}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Customer Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {customers.slice(0, 12).map((customer) => (
                            <div key={customer.id} className="bg-slate-800 rounded-xl p-6 shadow-lg text-slate-200 border border-slate-700 flex flex-col justify-between h-full group">
                                {/* Header */}
                                <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-4">
                                    <Link to={`/customers/${customer.id}`} className="font-bold text-lg text-white hover:text-blue-300 transition-colors truncate pr-2">
                                        {customer.name}
                                    </Link>
                                    <div className="text-xs bg-slate-700 px-2 py-1 rounded text-blue-300 shrink-0">
                                        #{customer.id}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center text-sm text-slate-300 gap-3">
                                        <span className="p-1.5 bg-slate-700 rounded-full">
                                            <Phone className="w-3 h-3" />
                                        </span>
                                        {customer.phone}
                                    </div>
                                    {customer.address ? (
                                        <div className="flex items-start text-sm text-slate-300 gap-3">
                                            <span className="p-1.5 bg-slate-700 rounded-full mt-0.5">
                                                <MapPin className="w-3 h-3" />
                                            </span>
                                            <span className="line-clamp-2">{customer.address}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-sm text-slate-500 gap-3 italic">
                                            <span className="p-1.5 bg-slate-700 rounded-full">
                                                <MapPin className="w-3 h-3" />
                                            </span>
                                            {t('customers.address')}...
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-between items-center text-slate-400">
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/customers/${customer.id}?tab=measurements`}
                                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                                            title={t('measurements.title')}
                                        >
                                            <Ruler className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to={`/customers/${customer.id}?tab=orders`}
                                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                                            title={t('customers.viewHistory')}
                                        >
                                            <History className="w-4 h-4" />
                                        </Link>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(customer)}
                                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition-colors"
                                            title={t('common.edit')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id!)}
                                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-700 rounded transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {customers.length > 12 && (
                        <div className="text-center text-gray-500 text-sm mt-4 italic">
                            {t('customers.showingTopResults', { count: 12, total: customers.length })}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <CustomerFormModal
                    customer={editingCustomer}
                    onClose={() => setIsModalOpen(false)}
                    onSaveAndMeasure={(id) => navigate(`/customers/${id}`)}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={t('common.confirmDelete')}
                isDestructive={true}
            />
        </PageTransition>
    );
}
