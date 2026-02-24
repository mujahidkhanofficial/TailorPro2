import { create } from 'zustand';
import { db, Order, OrderStatus, getTodayRange } from '@/db/database';

interface OrderState {
    orders: Order[];
    loading: boolean;
    statusFilter: OrderStatus | 'all';
    pendingOrders: Order[];
    dueTodayOrders: Order[];
    overdueOrders: Order[];
    stats: {
        monthlyRevenue: number;
    };

    loadOrders: () => Promise<void>;
    loadDashboardData: () => Promise<void>;
    setStatusFilter: (status: OrderStatus | 'all') => void;
    addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
    updateOrder: (id: number, data: Partial<Order>) => Promise<void>;
    deleteOrder: (id: number) => Promise<void>;
    getCustomerOrders: (customerId: number) => Promise<Order[]>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [],
    loading: false,
    statusFilter: 'all',
    pendingOrders: [],
    dueTodayOrders: [],
    overdueOrders: [],
    stats: {
        monthlyRevenue: 0,
    },

    loadOrders: async () => {
        set({ loading: true });
        try {
            const orders = await db.orders.orderBy('dueDate').toArray();
            set({ orders, loading: false });
        } catch (error) {
            console.error('Error loading orders:', error);
            set({ loading: false });
        }
    },

    loadDashboardData: async () => {
        try {
            const { start, end } = getTodayRange();

            // Calculate start and end of current month for revenue
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const orders = await db.orders.toArray();

            // Pending (Active)
            const pendingOrders = orders.filter((o: Order) => !['completed', 'delivered'].includes(o.status));

            // Due today (not completed/delivered)
            const dueTodayOrders = await db.orders
                .where('dueDate')
                .between(start, end)
                .filter((o: Order) => !['completed', 'delivered'].includes(o.status))
                .toArray();

            // Overdue (past due date, not completed/delivered)
            const overdueOrders = await db.orders
                .where('dueDate')
                .below(start)
                .filter((o: Order) => !['completed', 'delivered'].includes(o.status))
                .toArray();

            // Calculate Monthly Revenue (sum of advancePayment for orders created this month)
            // Note: In a real app, you'd probably have a separate 'Payments' table or 'price' field.
            // Here we assume advancePayment string contains the amount (e.g. "5000" or "Rs. 5000")
            const monthlyOrders = orders.filter(
                (o: Order) => o.createdAt >= startOfMonth && o.createdAt <= endOfMonth
            );

            const monthlyRevenue = monthlyOrders.reduce((total: number, order: Order) => {
                const amountStr = order.advancePayment?.replace(/[^0-9.]/g, '') || '0';
                return total + (parseFloat(amountStr) || 0);
            }, 0);

            set({
                pendingOrders,
                dueTodayOrders,
                overdueOrders,
                stats: {
                    monthlyRevenue
                }
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    },

    setStatusFilter: (status) => {
        set({ statusFilter: status });
    },

    addOrder: async (orderData) => {
        const now = new Date();
        const id = await db.orders.add({
            ...orderData,
            createdAt: now,
            updatedAt: now,
        });
        await get().loadOrders();
        await get().loadDashboardData();
        return id;
    },

    updateOrderStatus: async (id, status) => {
        await db.orders.update(id, {
            status,
            updatedAt: new Date(),
        });
        await get().loadOrders();
        await get().loadDashboardData();
    },

    updateOrder: async (id, data) => {
        await db.orders.update(id, {
            ...data,
            updatedAt: new Date(),
        });
        await get().loadOrders();
        await get().loadDashboardData();
    },

    deleteOrder: async (id) => {
        await db.measurements.where('orderId').equals(id).delete();
        await db.orders.delete(id);
        await get().loadOrders();
        await get().loadDashboardData();
    },

    getCustomerOrders: async (customerId) => {
        return await db.orders
            .where('customerId')
            .equals(customerId)
            .reverse()
            .sortBy('createdAt');
    },
}));
