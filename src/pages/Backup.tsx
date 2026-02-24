import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Customer, Order, CustomerMeasurement } from '@/db/database';
import PageTransition from '@/components/ui/PageTransition';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Upload, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Backup() {
    const { t } = useTranslation();


    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            if (!backup.data || !backup.data.customers || !backup.data.orders) {
                throw new Error('Invalid backup file');
            }

            await db.transaction('rw', [db.customers, db.orders, db.measurements, db.customerMeasurements, db.settings, db.workers], async () => {
                await db.customers.bulkPut(backup.data.customers);
                await db.orders.bulkPut(backup.data.orders);
                if (backup.data.settings) await db.settings.bulkPut(backup.data.settings);
                if (backup.data.workers) await db.workers.bulkPut(backup.data.workers);

                // Support both legacy and new measurement tables
                if (backup.data.customerMeasurements) {
                    await db.customerMeasurements.bulkPut(backup.data.customerMeasurements);
                } else if (backup.data.measurements) {
                    // Legacy fallback
                    await db.measurements.bulkPut(backup.data.measurements);
                }
            });

            toast.success(t('backup.importSuccess'));
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Import failed:', error);
            toast.error(t('backup.importError') || 'Import failed');
        }
    };

    const handleExportFull = async () => {
        try {
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {
                    customers: await db.customers.toArray(),
                    orders: await db.orders.toArray(),
                    measurements: await db.measurements.toArray(), // Legacy (optional)
                    customerMeasurements: await db.customerMeasurements.toArray(), // New Table
                    settings: await db.settings.toArray(),
                    workers: await db.workers.toArray(),
                },
            };

            const filename = `tailorpro-backup-${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`;
            const content = JSON.stringify(data, null, 2);

            if (window.electronAPI) {
                const result = await window.electronAPI.saveFile(content, filename);
                if (result.success) {
                    toast.success(t('backup.exportSuccess'));
                }
            } else {
                // Fallback for web
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(t('backup.exportSuccess'));
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('backup.exportError') || 'Export failed');
        }
    };

    const handleExportCSV = async () => {
        try {
            const customers = await db.customers.toArray();
            const orders = await db.orders.toArray();
            const measurements = await db.customerMeasurements.toArray();

            // Create a map for quick access to measurements by customerId
            const measurementMap = measurements.reduce((acc, m) => {
                acc[m.customerId] = m;
                return acc;
            }, {} as Record<number, CustomerMeasurement>);

            // Build CSV
            // Build CSV
            // Added measurement columns: Length, Sleeve, Bazu Center, Chest, Tera, Collar, Daman, Shalwar, Aasan, Pancha
            // Plus Dropdowns & Designs
            const headers = [
                'Name', 'Phone', 'Address', 'Total Orders', 'Last Order Date',
                // Standard Measurements
                'Length', 'Sleeve', 'Gol Bazu', 'Bazu Center', 'Chest', 'Tera', 'Collar', 'Daman', 'Shalwar', 'Aasan', 'Pancha',
                // Dropdowns
                'Collar Nok', 'Ban Patti', 'Patti Size', 'Cuff', 'Cuff Size', 'Front Pocket', 'Side Pocket', 'Front Strip', 'Daman Style', 'Shalwar Farmaish', 'Shalwar Width',
                // Designs
                'Single Silai', 'Single Chamak', 'Double Chamak', 'Double Tak', 'Choka Silai', 'Sada Double', 'Label', 'Shalwar Jeb',
                'Full Down Tera', 'Normal Tera', 'Hinger Tera', 'Sada Button', 'Fancy Button', 'Stad Kaaj Button'
            ];

            const rows = customers.map((c: Customer) => {
                const customerOrders = orders.filter((o: Order) => o.customerId === c.id);
                const lastOrder = customerOrders.sort(
                    (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];

                const m = measurementMap[c.id!]?.fields || {};
                const d = measurementMap[c.id!]?.designOptions || {};

                return [
                    `"${c.name}"`,
                    c.phone,
                    `"${c.address || ''}"`,
                    customerOrders.length,
                    lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString() : '',
                    // Measurements
                    `"${m.length || ''}"`,
                    `"${m.sleeve || ''}"`,
                    `"${m.golBazu || ''}"`,
                    `"${m.bazu_center || ''}"`,
                    `"${m.chest || ''}"`,
                    `"${m.tera || ''}"`,
                    `"${m.kalar || ''}"`,
                    `"${m.daaman || ''}"`,
                    `"${m.shalwar || ''}"`,
                    `"${m.aasan || ''}"`,
                    `"${m.pancha || ''}"`,
                    // Dropdowns (using raw value, could map to label if needed)
                    `"${m.collarNok || ''}"`,
                    `"${m.banPatti || ''}"`,
                    `"${m.pattiSize || ''}"`,
                    `"${m.cuff || ''}"`,
                    `"${m.cuffSize || ''}"`,
                    `"${m.frontPocket || ''}"`,
                    `"${m.sidePocket || ''}"`,
                    `"${m.frontStrip || ''}"`,
                    `"${m.hemStyle || ''}"`,
                    `"${m.shalwarFarmaish || ''}"`,
                    `"${m.shalwarWidth || ''}"`,
                    // Designs (Yes/No)
                    d.singleSilai ? 'Yes' : 'No',
                    d.singleChamakTaar ? 'Yes' : 'No',
                    d.doubleChamakTaar ? 'Yes' : 'No',
                    d.doubleTak ? 'Yes' : 'No',
                    d.chokaSilai ? 'Yes' : 'No',
                    d.sadaDouble ? 'Yes' : 'No',
                    d.labelHo ? 'Yes' : 'No',
                    d.shalwarJeb ? 'Yes' : 'No',
                    d.fullDownTera ? 'Yes' : 'No',
                    d.normalTera ? 'Yes' : 'No',
                    d.hingerTera ? 'Yes' : 'No',
                    d.sadaButton ? 'Yes' : 'No',
                    d.fancyButton ? 'Yes' : 'No',
                    d.stadKaajButton ? 'Yes' : 'No',
                ].join(',');
            });

            // Add BOM for Excel UTF-8 compatibility
            const BOM = '\uFEFF';
            const csv = BOM + [headers.join(','), ...rows].join('\n');
            const filename = `tailorpro-customers-${new Date().toISOString().split('T')[0]}.csv`;

            if (window.electronAPI) {
                const result = await window.electronAPI.saveFile(csv, filename);
                if (result.success) {
                    toast.success(t('backup.exportSuccess'));
                }
            } else {
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(t('backup.exportSuccess'));
            }
        } catch (error) {
            console.error('CSV export error:', error);
            toast.error('Export failed');
        }
    };

    const handleImport = async () => {
        try {
            let content: string | null = null;

            if (window.electronAPI) {
                const result = await window.electronAPI.openFile();
                if (result.success && result.content) {
                    content = result.content;
                }
            } else {
                // Fallback for web
                // Trigger file input click
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
                return;
            }

            if (!content) return;

            const backup = JSON.parse(content);

            // Validate backup structure
            if (!backup.data || !backup.data.customers || !backup.data.orders) {
                throw new Error('Invalid backup file');
            }

            // Import data (merge/replace)
            // Import data (merge/replace)
            await db.transaction('rw', [db.customers, db.orders, db.measurements, db.customerMeasurements, db.settings, db.workers], async () => {
                // Use bulkPut to update or insert
                await db.customers.bulkPut(backup.data.customers);
                await db.orders.bulkPut(backup.data.orders);
                if (backup.data.settings) await db.settings.bulkPut(backup.data.settings);
                if (backup.data.workers) await db.workers.bulkPut(backup.data.workers);

                if (backup.data.customerMeasurements) {
                    await db.customerMeasurements.bulkPut(backup.data.customerMeasurements);
                } else if (backup.data.measurements) {
                    await db.measurements.bulkPut(backup.data.measurements);
                }
            });

            toast.success(t('backup.importSuccess'));
        } catch (error) {
            console.error('Import error:', error);
            toast.error(t('backup.importError') || 'Import failed');
        }
    };


    const handleClearDatabase = () => {
        setIsClearModalOpen(true);
    };

    const performClearDatabase = async () => {
        try {
            await db.transaction('rw', [db.customers, db.orders, db.measurements, db.customerMeasurements, db.settings, db.workers], async () => {
                await db.customers.clear();
                await db.orders.clear();
                await db.measurements.clear();
                await db.customerMeasurements.clear();
                await db.settings.clear();
                await db.workers.clear();
            });

            toast.success(t('backup.clearSuccess') || 'Database cleared successfully');
            setIsClearModalOpen(false);
        } catch (error) {
            console.error('Clear failed:', error);
            toast.error('Failed to clear database');
        }
    };

    return (
        <PageTransition className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.backup')}</h1>

            {/* Export Section */}
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold">{t('backup.export')}</h2>

                <button onClick={handleExportFull} className="btn btn-primary w-full flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5 text-white" />
                    {t('backup.exportFull')}
                </button>

                <button onClick={handleExportCSV} className="btn btn-secondary w-full flex items-center justify-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    {t('backup.exportCustomers')}
                </button>
            </div>

            {/* Import Section */}
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold">{t('backup.import')}</h2>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    {t('backup.warning')}
                </div>

                <button onClick={handleImport} className="btn btn-success w-full flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    {t('backup.importBackup')}
                </button>
            </div>

            {/* Danger Zone */}
            <div className="card space-y-4 border-red-100 bg-red-50">
                <h2 className="text-lg font-semibold text-red-800">{t('backup.dangerZone') || 'Danger Zone'}</h2>
                <button
                    onClick={handleClearDatabase}
                    className="btn btn-danger w-full flex items-center justify-center gap-2"
                >
                    <AlertTriangle className="w-5 h-5" />
                    {t('backup.clearData') || 'Clear All Data (Factory Reset)'}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
            />

            <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={performClearDatabase}
                title={t('backup.clearConfirmTitle')}
                message={t('backup.clearConfirmMessage')}
                confirmText={t('common.delete')}
                isDestructive={true}
                requirePassword={true}
            />
        </PageTransition>
    );
}
