import Dexie, { Table } from 'dexie';

// ==========================================
// 1. Interfaces & Types
// ==========================================

// GarmentType removed - measurements are now at customer level only

export type OrderStatus =
    | 'new'
    | 'in_progress'
    | 'ready'
    | 'delivered'
    | 'completed';

export type WorkerRole = 'cutter' | 'checker' | 'karigar';

export interface Customer {
    id?: number;
    name: string;
    phone: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Order {
    id?: number;
    customerId: number;
    status: OrderStatus;
    dueDate: Date;
    advancePayment?: string;
    suitsCount?: number;
    deliveryNotes?: string;
    cutterId?: number;
    checkerId?: number;
    karigarId?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Legacy Measurement interface - keeping for backward compatibility
export interface Measurement {
    id?: number;
    orderId: number;
    template?: string; // Legacy field, no longer used
    fields: Record<string, string>;
}

export interface CustomerMeasurement {
    id?: number;
    customerId: number;
    fields: Record<string, string>;
    designOptions: Record<string, boolean>;
    createdAt: Date;
    updatedAt: Date;
}

export interface Settings {
    id?: number;
    shopName: string;
    address: string;
    phone1: string;
    phone2: string;
    defaultPrinter?: string;
    appTitle?: string; // Custom app title in sidebar
    password?: string; // For admin login
    updatedAt: Date;
}
// ... (skip lines)
// Version 7: Add defaultPrinter settings


export interface Worker {
    id?: number;
    name: string;
    phone?: string;
    role: WorkerRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// 2. Database Class
// ==========================================

class TailorProDB extends Dexie {
    public customers!: Table<Customer, number>;
    public orders!: Table<Order, number>;
    public measurements!: Table<Measurement, number>;
    public customerMeasurements!: Table<CustomerMeasurement, number>;
    public settings!: Table<Settings, number>;
    public workers!: Table<Worker, number>;

    constructor() {
        super('TailorProDB');

        // Development Model: Single Schema Version containing all tables
        // Since we are in development, we are squashing migrations into version 1.
        this.version(1).stores({
            customers: '++id, name, &phone, createdAt',
            orders: '++id, customerId, status, dueDate, createdAt, cutterId, checkerId, karigarId',
            measurements: '++id, orderId',
            customerMeasurements: '++id, customerId, updatedAt',
            settings: '++id, updatedAt',
            workers: '++id, name, role, isActive, createdAt'
        });
    }
}

// Export singleton instance
export const db = new TailorProDB();

// ==========================================
// 3. Global Helpers
// ==========================================

export function getTodayRange(): { start: Date; end: Date } {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return { start, end };
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
