import { create } from 'zustand';
import { db, Customer } from '@/db/database';

interface CustomerState {
    customers: Customer[];
    loading: boolean;
    searchQuery: string;
    selectedCustomer: Customer | null;

    loadCustomers: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    addCustomer: (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateCustomer: (id: number, data: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    selectCustomer: (customer: Customer | null) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: [],
    loading: false,
    searchQuery: '',
    selectedCustomer: null,

    loadCustomers: async () => {
        const currentCustomers = get().customers;
        if (currentCustomers.length === 0) {
            set({ loading: true });
        }
        try {
            const { searchQuery } = get();
            let customers: Customer[];

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                customers = await db.customers
                    .filter(
                        (c) =>
                            c.name.toLowerCase().includes(query) ||
                            c.phone.includes(query) ||
                            (c.id?.toString().includes(query) || false)
                    )
                    .toArray();
            } else {
                customers = await db.customers.orderBy('createdAt').reverse().toArray();
            }

            set({ customers, loading: false });
        } catch (error) {
            console.error('Error loading customers:', error);
            set({ loading: false });
        }
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().loadCustomers();
    },

    addCustomer: async (customerData) => {
        const now = new Date();
        const id = await db.customers.add({
            ...customerData,
            createdAt: now,
            updatedAt: now,
        });
        await get().loadCustomers();
        return id;
    },

    updateCustomer: async (id, data) => {
        await db.customers.update(id, {
            ...data,
            updatedAt: new Date(),
        });
        await get().loadCustomers();
    },

    deleteCustomer: async (id) => {
        // Delete related orders and measurements
        const orders = await db.orders.where('customerId').equals(id).toArray();
        for (const order of orders) {
            await db.measurements.where('orderId').equals(order.id!).delete();
        }
        await db.orders.where('customerId').equals(id).delete();
        await db.customers.delete(id);
        await get().loadCustomers();
    },

    selectCustomer: (customer) => {
        set({ selectedCustomer: customer });
    },
}));
