import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkerStore } from '@/stores/workerStore';
import { Worker, WorkerRole } from '@/db/database';
import WorkerFormModal from '@/components/forms/WorkerFormModal';
import { Plus, Search, HardHat, Edit2, Trash2, Scissors, CheckCircle2, Wrench, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';

// Role configurations with solid colors
const roleConfig: Record<WorkerRole, { icon: React.ReactNode; bgColor: string; label: string }> = {
    cutter: {
        icon: <Scissors className="w-10 h-10 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-blue-500',
        label: 'Cutter'
    },
    checker: {
        icon: <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-emerald-500',
        label: 'Checker'
    },
    karigar: {
        icon: <Wrench className="w-10 h-10 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-orange-500',
        label: 'Karigar'
    },
};

export default function Workers() {
    const { t } = useTranslation();
    const { workers, loading, roleFilter, searchQuery, loadWorkers, setRoleFilter, setSearchQuery, deleteWorker } = useWorkerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | undefined>(undefined);

    useEffect(() => {
        loadWorkers();
    }, []);

    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchQuery]);

    const handleAddNew = () => {
        setEditingWorker(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        toast((t_toast) => (
            <div className="flex items-center gap-3">
                <span>{t('common.confirmDelete')}</span>
                <button
                    onClick={async () => {
                        toast.dismiss(t_toast.id);
                        await deleteWorker(id);
                        toast.success(t('common.deleteSuccess'));
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                    {t('common.delete')}
                </button>
                <button
                    onClick={() => toast.dismiss(t_toast.id)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                    {t('common.cancel')}
                </button>
            </div>
        ), { duration: 10000 });
    };

    // Filter workers
    const filteredWorkers = workers.filter(worker => {
        const matchesRole = roleFilter === 'all' || worker.role === roleFilter;
        const matchesSearch = !searchQuery ||
            worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });
    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('workers.title')}</h1>
                <button onClick={handleAddNew} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('workers.addNew')}
                </button>
            </div>

            {/* Role Filter Tabs - With 3D Effect */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'all'
                        ? 'bg-gray-800 text-white border-gray-950'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                >
                    <HardHat className="w-4 h-4" />
                    {t('common.all')}
                </button>
                <button
                    onClick={() => setRoleFilter('cutter')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'cutter'
                        ? 'bg-blue-500 text-white border-blue-700'
                        : 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200'
                        }`}
                >
                    <Scissors className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.cutter')}
                </button>
                <button
                    onClick={() => setRoleFilter('checker')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'checker'
                        ? 'bg-emerald-500 text-white border-emerald-700'
                        : 'bg-emerald-100 text-emerald-600 border-emerald-300 hover:bg-emerald-200'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.checker')}
                </button>
                <button
                    onClick={() => setRoleFilter('karigar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'karigar'
                        ? 'bg-orange-500 text-white border-orange-700'
                        : 'bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200'
                        }`}
                >
                    <Wrench className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.karigar')}
                </button>
            </div>

            {/* Search - Card Style with 3D Effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex rounded-xl overflow-hidden border border-gray-200 border-b-4 border-b-gray-300 bg-white shadow-sm">
                    <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0 border-b-4 border-b-gray-950">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <input
                        id="worker-search"
                        type="text"
                        placeholder={t('workers.search')}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Worker List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card flex items-center gap-4">
                            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-12 card flex flex-col items-center">
                    <div className="transform scale-150 mb-4 opacity-50"><HardHat className="w-24 h-24 text-gray-200" /></div>
                    <p className="text-gray-500 text-lg">{t('workers.noWorkers')}</p>
                    <button onClick={handleAddNew} className="btn btn-primary mt-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        {t('workers.addNew')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkers.map((worker) => {
                        const config = roleConfig[worker.role];
                        return (
                            <div
                                key={worker.id}
                                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group flex"
                            >
                                {/* Icon Section - Always 1:1 Square */}
                                <div className={`${config.bgColor} aspect-square w-20 sm:w-24 flex items-center justify-center shrink-0`}>
                                    {config.icon}
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{worker.name}</h3>
                                                {!worker.isActive && (
                                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full shrink-0">
                                                        {t('workers.inactive')}
                                                    </span>
                                                )}
                                            </div>

                                            {worker.phone && (
                                                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {worker.phone}
                                                </p>
                                            )}

                                            <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded text-white ${config.bgColor}`}>
                                                {t(`workers.roles.${worker.role}`)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleEdit(worker)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(worker.id!)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <WorkerFormModal
                    worker={editingWorker}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </PageTransition>
    );
}
