import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Worker, Order } from '@/db/database';

import { Printer, Scissors, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { designOptions } from '@/db/templates';
import { generateKarigarReportHTML } from '@/utils/printHelpers';
import { usePrinter } from '@/hooks/usePrinter';
import PageTransition from '@/components/ui/PageTransition';

export default function KarigarProgress() {
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const { printSlip, isPrinting } = usePrinter();

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | 'all'>('all');
    // Default to last 7 days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<(Order & { customerName: string, designSpecsEn: string[], designSpecsUr: string[] })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkers();
    }, []);

    useEffect(() => {
        loadOrders();
    }, [selectedWorkerId, startDate, endDate]);

    async function loadWorkers() {
        // Filter only 'karigar' role
        const allWorkers = await db.workers.where('role').equals('karigar').toArray();
        setWorkers(allWorkers);
    }

    async function loadOrders() {
        setLoading(true);
        try {
            // 1. Get orders in date range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            let allOrders = await db.orders
                .where('createdAt')
                .between(start, end, true, true)
                .toArray();

            // 2. Filter by Worker (Karigar)
            if (selectedWorkerId !== 'all') {
                allOrders = allOrders.filter(o => o.karigarId === selectedWorkerId);
            } else {
                // If 'all' selected, still ensure they have a karigar assigned? 
                // Or just show all orders? Let's show only orders with a Karigar assigned for clarify.
                allOrders = allOrders.filter(o => o.karigarId);
            }

            // 3. Enrich with Customer Name and Design Specs
            const enrichedOrders = await Promise.all(allOrders.map(async (order) => {
                const customer = await db.customers.get(order.customerId);
                const measurement = await db.customerMeasurements
                    .where('customerId')
                    .equals(order.customerId)
                    .first();

                // Extract Design Specs (Farmaish)
                const specsEn: string[] = [];
                const specsUr: string[] = [];
                if (measurement && measurement.designOptions) {
                    Object.entries(measurement.designOptions).forEach(([key, isSelected]) => {
                        if (isSelected) {
                            const option = designOptions.find(opt => opt.key === key);
                            if (option) {
                                specsEn.push(option.labelEn);
                                specsUr.push(option.labelUr);
                            }
                        }
                    });
                }

                return {
                    ...order,
                    customerName: customer?.name || 'Unknown',
                    designSpecsEn: specsEn,
                    designSpecsUr: specsUr
                };
            }));

            setOrders(enrichedOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = async () => {
        if (selectedWorkerId === 'all') {
            toast.error(isUrdu ? 'برائے مہربانی پرنٹ کرنے کے لیے ایک کاریگر منتخب کریں' : 'Please select a specific Karigar to print report');
            return;
        }

        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) return;

        // Generate HTML report
        // We'll need to define this function in printHelpers
        const html = generateKarigarReportHTML(
            worker,
            orders,
            { start: new Date(startDate), end: new Date(endDate) }
        );

        await printSlip(html);
    };

    const handlePreview = async () => {
        if (selectedWorkerId === 'all') {
            toast.error(isUrdu ? 'برائے مہربانی پیش نظارہ کے لیے ایک کاریگر منتخب کریں' : 'Please select a specific Karigar to preview report');
            return;
        }

        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) return;

        const html = generateKarigarReportHTML(
            worker,
            orders,
            { start: new Date(startDate), end: new Date(endDate) }
        );

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    const totalSuits = orders.reduce((sum, order) => sum + (order.suitsCount || 1), 0);

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Scissors className="w-6 h-6 text-primary-600" />
                        {isUrdu ? 'کاریگر کی ہفتہ وار پروگریس' : 'Karigar Weekly Progress'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isUrdu ? 'سلائی کے کام اور ادائیگی کی رپورٹ' : 'Track stitching progress and payment reports'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePreview}
                        disabled={orders.length === 0}
                        className="bg-white text-gray-700 border border-gray-200 border-b-4 active:border-b active:translate-y-1 hover:bg-gray-50 px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        <span>{isUrdu ? 'پیش نظارہ' : 'Preview'}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={orders.length === 0 || isPrinting}
                        className="btn btn-primary flex items-center gap-2 shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{isUrdu ? 'رپورٹ پرنٹ کریں' : 'Print Report'}</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 ring-1 ring-black/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Worker Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {isUrdu ? 'کاریگر منتخب کریں' : 'Select Karigar'}
                        </label>
                        <select
                            value={selectedWorkerId}
                            onChange={(e) => setSelectedWorkerId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="input w-full h-14 py-1 text-center text-lg font-semibold appearance-none"
                            dir={isUrdu ? 'rtl' : 'ltr'}
                        >
                            <option value="all">{isUrdu ? 'تمام کاریگر' : 'All Karigars'}</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {isUrdu ? 'تاریک از' : 'From Date'}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input w-full h-14 py-1 text-center text-lg font-semibold uppercase"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {isUrdu ? 'تاریک تک' : 'To Date'}
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input w-full h-14 py-1 text-center text-lg font-semibold uppercase"
                        />
                    </div>
                </div>
            </div>

            {/* Summary & Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 ring-1 ring-black/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-300 bg-white flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">
                        {isUrdu ? 'کام کی تفصیل' : 'Work Details'}
                    </h3>
                    <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-bold">
                        {isUrdu ? `کل سوٹ: ${totalSuits}` : `Total Suits: ${totalSuits}`}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className={`w-full border-collapse ${isUrdu ? 'text-right' : 'text-left'}`}>
                        <thead>
                            <tr className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
                                <th className="px-6 py-3">{isUrdu ? 'تاریخ' : 'Date'}</th>
                                <th className="px-6 py-3">{isUrdu ? 'آرڈر نمبر' : 'Order #'}</th>
                                <th className="px-6 py-3">{isUrdu ? 'کسٹمر' : 'Customer'}</th>
                                <th className="px-6 py-3">{isUrdu ? 'کل سوٹ' : 'Total Suits'}</th>
                                <th className="px-6 py-3 w-1/3">{isUrdu ? 'ڈیزائن / فرمائش' : 'Design Specs'}</th>
                                <th className="px-6 py-3">{isUrdu ? 'اسٹیٹس' : 'Status'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                                        {t('common.loading')}
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        {isUrdu ? 'کوئی ریکارڈ نہیں ملا' : 'No records found for this period'}
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const displaySpecs = isUrdu ? order.designSpecsUr : order.designSpecsEn;

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                                {order.customerName}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                                {order.suitsCount || 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                {displaySpecs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {displaySpecs.map((spec, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                                                        {isUrdu ? 'سادہ' : 'Simple'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {t(`orders.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}` as any)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageTransition>
    );
}
