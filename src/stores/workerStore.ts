import { create } from 'zustand';
import { db, Worker, WorkerRole } from '@/db/database';

interface WorkerState {
    workers: Worker[];
    loading: boolean;
    roleFilter: WorkerRole | 'all';
    searchQuery: string;

    loadWorkers: () => Promise<void>;
    setRoleFilter: (role: WorkerRole | 'all') => void;
    setSearchQuery: (query: string) => void;
    addWorker: (worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateWorker: (id: number, data: Partial<Worker>) => Promise<void>;
    deleteWorker: (id: number) => Promise<void>;
    getWorkersByRole: (role: WorkerRole) => Worker[];
    getActiveWorkers: () => Worker[];
    getWorkerById: (id: number) => Worker | undefined;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
    workers: [],
    loading: false,
    roleFilter: 'all',
    searchQuery: '',

    loadWorkers: async () => {
        set({ loading: true });
        try {
            const workers = await db.workers.orderBy('name').toArray();
            set({ workers, loading: false });
        } catch (error) {
            console.error('Error loading workers:', error);
            set({ loading: false });
        }
    },

    setRoleFilter: (role) => {
        set({ roleFilter: role });
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    addWorker: async (workerData) => {
        const now = new Date();
        const id = await db.workers.add({
            ...workerData,
            createdAt: now,
            updatedAt: now,
        });
        await get().loadWorkers();
        return id;
    },

    updateWorker: async (id, data) => {
        await db.workers.update(id, {
            ...data,
            updatedAt: new Date(),
        });
        await get().loadWorkers();
    },

    deleteWorker: async (id) => {
        await db.workers.delete(id);
        await get().loadWorkers();
    },

    getWorkersByRole: (role) => {
        return get().workers.filter(w => w.role === role && w.isActive);
    },

    getActiveWorkers: () => {
        return get().workers.filter(w => w.isActive);
    },

    getWorkerById: (id) => {
        return get().workers.find(w => w.id === id);
    },
}));
