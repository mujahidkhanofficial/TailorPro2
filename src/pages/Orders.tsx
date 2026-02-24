import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { db, Customer } from '@/db/database';
import { orderStatusOptions } from '@/db/templates';
import { formatDate, formatDaysRemaining } from '@/utils/formatters';
import { Plus, ShoppingBag, Search, Calendar, Phone, Trash2, Wallet, Clock, CheckCircle, Truck, CheckSquare, Printer } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { Order } from '@/db/database';
import toast from 'react-hot-toast';
import { generateMeasurementSlipHTML } from '@/utils/printHelpers';
import { usePrinter } from '@/hooks/usePrinter';


export default function Orders() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isUrdu = i18n.language === 'ur';
    const {
        orders,
        loading,
        statusFilter,
        setStatusFilter,
        loadOrders,
        deleteOrder
    } = useOrderStore();

    // Alternatively load customers map if store doesn't provide easy access
    // But useCustomerStore has an array. Let's create a map for easier lookup if needed, 
    // or just rely on the store's data if it's already loaded.
    // For now, let's load customers to ensure we have names.
    const [customerMap, setCustomerMap] = useState<Record<number, Customer>>({});
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { printSlip } = usePrinter();

    const handleQuickPrint = async (e: React.MouseEvent, order: Order) => {
        e.preventDefault();
        e.stopPropagation();

        const customer = customerMap[order.customerId];
        if (!customer) {
            toast.error(t('common.error'));
            return;
        }

        const loadingId = toast.loading(isUrdu ? 'پرنٹ لا رہا ہے...' : 'Preparing print...');
        try {
            const measurement = await db.customerMeasurements.where('customerId').equals(order.customerId).first();
            if (!measurement) {
                toast.error(isUrdu ? 'کوئی ناپ نہیں ملا' : 'No measurement found', { id: loadingId });
                return;
            }

            const settings = await db.settings.get(1);
            // Fetch worker names
            const cutter = order.cutterId ? await db.workers.get(order.cutterId) : undefined;
            const checker = order.checkerId ? await db.workers.get(order.checkerId) : undefined;
            const karigar = order.karigarId ? await db.workers.get(order.karigarId) : undefined;

            const workerNames = {
                cutter: cutter?.name,
                checker: checker?.name,
                karigar: karigar?.name
            };

            const html = generateMeasurementSlipHTML(customer, measurement, settings, workerNames, order);
            toast.dismiss(loadingId);
            await printSlip(html, { silentOnly: true });

        } catch (error) {
            console.error('Quick Print Error:', error);
            toast.error(t('common.error'), { id: loadingId });
        }
    };



    useEffect(() => {
        loadOrders();
        loadCustomersMap();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                navigate('/orders/create');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadCustomersMap = async () => {
        const all = await db.customers.toArray();
        const map: Record<number, Customer> = {};
        all.forEach((c: Customer) => { if (c.id) map[c.id] = c; });
        setCustomerMap(map);
    };



    const [searchQuery, setSearchQuery] = useState('');

    // Filter by search query
    // Filter by search query and status
    const filteredOrders = orders.filter(order => {
        const customer = customerMap[order.customerId];
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch = !searchQuery ||
            order.id?.toString().includes(searchLower) ||
            customer?.name.toLowerCase().includes(searchLower) ||
            customer?.phone.includes(searchLower);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteOrder(deleteId);
            toast.success(t('common.deleteSuccess'));
            setDeleteId(null);
        }
    };

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
                <Link to="/orders/create" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('orders.addNew')}
                </Link>
            </div>

            {/* Status Filter - With Icons & 3D Effect */}
            <div className="flex flex-wrap gap-2">
                {/* Calculate counts */}
                {(() => {
                    const counts = {
                        all: orders.length,
                        new: orders.filter(o => o.status === 'new').length,
                        in_progress: orders.filter(o => o.status === 'in_progress').length,
                        ready: orders.filter(o => o.status === 'ready').length,
                        delivered: orders.filter(o => o.status === 'delivered').length,
                        completed: orders.filter(o => o.status === 'completed').length,
                    };

                    return (
                        <>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'all'
                                    ? 'bg-gray-800 text-white border-gray-950'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {t('common.all')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {counts.all}
                                </span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('new')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'new'
                                    ? 'bg-blue-500 text-white border-blue-700'
                                    : 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                {t('orders.statusNew')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'new' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'}`}>
                                    {counts.new}
                                </span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('in_progress')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'in_progress'
                                    ? 'bg-yellow-500 text-white border-yellow-700'
                                    : 'bg-yellow-100 text-yellow-600 border-yellow-300 hover:bg-yellow-200'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                {t('orders.statusInProgress')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-yellow-200 text-yellow-700'}`}>
                                    {counts.in_progress}
                                </span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('ready')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'ready'
                                    ? 'bg-green-500 text-white border-green-700'
                                    : 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {t('orders.statusReady')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'ready' ? 'bg-green-600 text-white' : 'bg-green-200 text-green-700'}`}>
                                    {counts.ready}
                                </span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('delivered')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'delivered'
                                    ? 'bg-gray-700 text-white border-gray-900' // Darker active state for better contrast
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                <Truck className="w-4 h-4" />
                                {t('orders.statusDelivered')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'delivered' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {counts.delivered}
                                </span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${statusFilter === 'completed'
                                    ? 'bg-purple-500 text-white border-purple-700'
                                    : 'bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200'
                                    }`}
                            >
                                <CheckSquare className="w-4 h-4" />
                                {t('orders.statusCompleted')}
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === 'completed' ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-700'}`}>
                                    {counts.completed}
                                </span>
                            </button>
                        </>
                    );
                })()}
            </div>

            {/* Search - Grid wrapper with same breakpoints as cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="flex rounded-xl overflow-hidden border border-gray-200 border-b-4 border-b-gray-300 bg-white shadow-sm">
                    <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0 border-b-4 border-b-gray-950">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('customers.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Order List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card h-40 flex flex-col justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 card flex flex-col items-center">
                    <div className="transform scale-150 mb-4 opacity-50"><ShoppingBag className="w-24 h-24 text-gray-200" /></div>
                    <p className="text-gray-500 text-lg">{searchQuery ? t('common.noResults') : t('orders.noOrders')}</p>
                    <Link to="/orders/create" className="btn btn-primary mt-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        {t('orders.addNew')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map((order) => {
                        const customer = customerMap[order.customerId];
                        const statusOption = orderStatusOptions.find((s) => s.value === order.status);
                        const isOverdue =
                            new Date(order.dueDate) < new Date() &&
                            !['completed', 'delivered'].includes(order.status);

                        const daysInfo = formatDaysRemaining(order.dueDate, isUrdu, order.status);

                        // Dark theme status colors
                        const darkStatusColors: Record<string, string> = {
                            new: 'bg-blue-500/20 text-blue-300',
                            in_progress: 'bg-yellow-500/20 text-yellow-300',
                            ready: 'bg-green-500/20 text-green-300',
                            delivered: 'bg-slate-600 text-slate-300',
                            completed: 'bg-purple-500/20 text-purple-300',
                        };

                        return (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className={`bg-slate-800 rounded-xl p-6 shadow-lg text-slate-200 border border-slate-700 flex flex-col justify-between h-full group hover:border-slate-600 transition-colors ${isOverdue ? 'ring-2 ring-red-500/30' : ''}`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-4">
                                    <span className="font-bold text-lg text-white hover:text-blue-300 transition-colors truncate pr-2">
                                        {customer?.name || 'Unknown'}
                                    </span>
                                    <div className="text-xs bg-slate-700 px-2 py-1 rounded text-blue-300 shrink-0">
                                        #{order.id}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-3 mb-4 flex-1 text-sm">
                                    {/* Phone */}
                                    {customer && (
                                        <div className="flex items-center text-slate-300 gap-3">
                                            <span className="p-1.5 bg-slate-700 rounded-full">
                                                <Phone className="w-3 h-3" />
                                            </span>
                                            <span>{customer.phone}</span>
                                        </div>
                                    )}

                                    {/* Order Date */}
                                    <div className="flex items-center text-slate-300 gap-3">
                                        <span className="p-1.5 bg-slate-700 rounded-full">
                                            <Calendar className="w-3 h-3" />
                                        </span>
                                        <span className="text-slate-500">{t('orders.orderDate')}:</span>
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>

                                    {/* Due Date */}
                                    <div className="flex items-center text-slate-300 gap-3">
                                        <span className="p-1.5 bg-slate-700 rounded-full">
                                            <ShoppingBag className="w-3 h-3" />
                                        </span>
                                        <span className="text-slate-500">{t('orders.dueDate')}:</span>
                                        <span>{formatDate(order.dueDate)}</span>
                                        {daysInfo.text && (
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${daysInfo.color.includes('red') ? 'bg-red-500/20 text-red-300' : daysInfo.color.includes('yellow') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                                {daysInfo.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Advance Payment */}
                                    {/* Advance Payment */}
                                    <div className="flex items-center text-slate-300 gap-3">
                                        <span className="p-1.5 bg-slate-700 rounded-full">
                                            <Wallet className="w-3 h-3" />
                                        </span>
                                        <span className="text-slate-500">{t('orders.advancePayment')}:</span>
                                        <span className="text-emerald-400 font-semibold">{order.advancePayment || 0}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${darkStatusColors[order.status] || 'bg-slate-600 text-slate-300'}`}>
                                        {t(statusOption?.label || '')}
                                    </span>

                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => handleQuickPrint(e, order)}
                                            className="text-slate-500 hover:text-cyan-600 p-1 rounded-md hover:bg-slate-700 transition-colors"
                                            title={isUrdu ? 'سلپ پرنٹ کریں' : 'Print Slip'}
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent navigation
                                                setDeleteId(order.id!);
                                            }}
                                            className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-700 transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('orders.deleteTitle')}
                message={t('orders.deleteConfirm')}
            />


        </PageTransition>
    );
}
