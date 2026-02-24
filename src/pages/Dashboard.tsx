
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrderStore } from '@/stores/orderStore';
import {
    Users,
    ShoppingBag,
    Calendar,
    AlertCircle,
    Plus,
    Check
} from 'lucide-react';
import { formatDaysRemaining } from '@/utils/formatters';
import { ReactNode } from 'react';

import PageTransition from '@/components/ui/PageTransition';
import { useUIStore } from '@/stores/uiStore';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customers, loadCustomers } = useCustomerStore();
    const pendingOrders = useOrderStore((state) => state.pendingOrders);
    const dueTodayOrders = useOrderStore((state) => state.dueTodayOrders);
    const overdueOrders = useOrderStore((state) => state.overdueOrders);
    // @ts-ignore
    const stats = useOrderStore((state) => state.stats);
    const { onboardingCompleted } = useUIStore();

    useEffect(() => {
        loadCustomers();
        useOrderStore.getState().loadDashboardData();

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // New Order: Ctrl + N
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                navigate('/orders/create');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <PageTransition className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dashboard.title')}</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="w-10 h-10" />}
                    label={t('dashboard.totalCustomers')}
                    value={customers.length}
                    color="blue"
                />
                <StatCard
                    icon={<ShoppingBag className="w-10 h-10" />}
                    label={t('dashboard.pendingOrders')}
                    value={pendingOrders.length}
                    color="yellow"
                />
                <StatCard
                    icon={<Calendar className="w-10 h-10" />}
                    label={t('dashboard.dueToday')}
                    value={dueTodayOrders.length}
                    color="green"
                />
                <StatCard
                    icon={<AlertCircle className="w-10 h-10" />}
                    label={t('dashboard.overdue')}
                    value={overdueOrders.length}
                    color="red"
                />
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Due Today */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-gray-800">
                            <div className="bg-emerald-500 p-2.5 rounded-xl text-white">
                                <Calendar className="w-5 h-5" />
                            </div>
                            {t('dashboard.dueToday')}
                        </h2>

                        {dueTodayOrders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium mb-4">{t('dashboard.noOrdersDueToday')}</p>
                                <button
                                    onClick={() => navigate('/orders/create')}
                                    className="btn btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('orders.addNew')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dueTodayOrders.map((order) => {
                                    const customer = customers.find(c => c.id === order.customerId);
                                    return (
                                        <Link
                                            key={order.id}
                                            to={`/orders/${order.id}`}
                                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex group"
                                        >
                                            {/* Icon Section */}
                                            <div className="bg-emerald-500 w-16 flex items-center justify-center shrink-0">
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            {/* Content Section */}
                                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                                <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                                    {customer?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {customer?.phone} • Order #{order.id}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Overdue */}
                <div className="space-y-6">
                    {overdueOrders.length > 0 ? (
                        <div className="card">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-gray-800">
                                <div className="bg-red-500 p-2.5 rounded-xl text-white">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                {t('dashboard.overdue')}
                            </h2>
                            <div className="space-y-3">
                                {overdueOrders.map((order) => {
                                    const customer = customers.find(c => c.id === order.customerId);
                                    const daysInfo = formatDaysRemaining(order.dueDate);
                                    return (
                                        <Link
                                            key={order.id}
                                            to={`/orders/${order.id}`}
                                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex group"
                                        >
                                            {/* Icon Section */}
                                            <div className="bg-red-500 w-14 flex items-center justify-center shrink-0">
                                                <AlertCircle className="w-5 h-5 text-white" />
                                            </div>
                                            {/* Content Section */}
                                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                                <p className="font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors truncate">
                                                    {customer?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-red-600 font-medium">
                                                    ⚠️ {daysInfo.text}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col items-center justify-center text-center p-8 h-full">
                            <div className="bg-emerald-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">{t('dashboard.allCaughtUp')}</h3>
                            <p className="text-gray-500 text-sm mt-1">{t('dashboard.noOverdueOrders')}</p>
                        </div>
                    )}
                </div>
            </div>

            {!onboardingCompleted && (
                <OnboardingWizard
                    onComplete={() => { }}
                    onOpenNewOrder={() => navigate('/orders/create')}
                />
            )}
        </PageTransition>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'green' | 'red';
}) {
    const iconBgColors = {
        blue: 'bg-blue-500',
        yellow: 'bg-amber-500',
        green: 'bg-emerald-500',
        red: 'bg-red-500',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex">
            {/* Icon Section - Solid Color 1:1 */}
            <div className={`${iconBgColors[color]} w-20 aspect-square flex items-center justify-center shrink-0`}>
                <div className="text-white">
                    {icon}
                </div>
            </div>
            {/* Content Section */}
            <div className="flex-1 p-4 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
        </div>
    );
}
