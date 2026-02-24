Tailor Pro – Complete Technical & Product Documentation
Version 1.0
Offline-First, Lifetime-Free Tailor Management App for Gentlemen in Pakistan

1. Overview
1.1 Purpose
Tailor Pro is a desktop-first, offline-native application designed exclusively for male tailors (darzis) in Pakistan to manage customers, measurements, orders, and delivery tracking—without requiring internet, accounts, or payments. The app guarantees lifetime free access, works on low-end Windows PCs, and respects data privacy by storing all information locally.

1.2 Core Principles
✅ 100% Offline-First: No internet required for core functionality.
✅ Zero Cost Forever: No subscriptions, ads, or hidden fees.
✅ Privacy by Design: All data stays on the user’s device.
✅ Localized for Pakistan: Urdu + English UI, local garment types, RTL support.
✅ Electron-Based Desktop App: Installable .exe for Windows (primary OS in Pakistani tailoring shops).
2. Target User Profile
Role: Solo male tailor (often runs a small shop)
Tech Level: Basic computer literacy (uses WhatsApp, Facebook)
Device: Windows 7/10/11 PC or laptop (2GB+ RAM, HDD/SSD)
Pain Points:
Loses paper measurement books
Forgets order status
Struggles with customer recall
Needs simple, fast digital replacement
3. Technology Stack
Layer
Technology
Justification
Frontend
React 18 + TypeScript + Vite
Fast dev, type safety, minimal bundle
State Management
Zustand
Lightweight, no boilerplate
Local Database
Dexie.js (IndexedDB wrapper)
Offline-first, promise-based, Electron-compatible
Desktop Runtime
Electron 30+
Cross-platform desktop, Chromium engine
Build & Packaging
Electron Builder
Auto-updates, NSIS installer for Windows
Styling
Tailwind CSS + dir="auto"
Rapid UI, RTL/LTR support
Localization
react-i18next
Urdu/English toggle
Testing
Vitest (unit), Playwright (E2E)
Ensure reliability on low-end devices
No backend. No cloud. No auth.

4. Core Features (Production-Grade)
4.1 Customer Management
Fields:
Full Name (Urdu/English)
Phone Number (PK format: 03XX-XXXXXXX)
Address (optional)
Photo (optional, stored as base64 in IndexedDB)
Actions:
Add/Edit/Delete
Search by name or phone
View full history of orders per customer
Validation:
Phone must be 11–13 digits (supports landline/mobile)
Name required
4.2 Measurement System
Garment Templates (predefined):
Sherwani
Kurta Pajama
Western Suit
Pathani Suit
Casual Shirt/Pant
Custom Fields per Template:
ts
123456
interface Measurement {
  id: number;
  orderId: number;
  template: 'sherwani' | 'suit' | ...;
  fields: Record<string, string>; // e.g., { chest: "40", waist: "36", length: "42" }
}
UI: Dynamic form based on selected template
Storage: Linked to order (not customer) — allows multiple fits per customer
4.3 Order Management
Status Flow:
New → In Progress → Ready → Delivered → Completed
Fields:
Garment Type
Due Date (defaults to +3 days)
Advance Payment (optional note)
Delivery Notes
Auto-Reminders:
Highlight overdue orders in red
Show “Due Today” banner on launch
4.4 Data Export & Backup
Export Options:
Full Backup: tailorpro-backup-YYYYMMDD.json (all data)
Customer Export: CSV with name, phone, last order date
Restore: Import .json via file dialog → merge with existing DB
Security: No encryption (user owns device); files can be shared via WhatsApp/email
4.5 Localization (Urdu + English)
Toggle: Top-right language switcher
RTL Support:
Entire UI flips when Urdu selected
Fonts: Noto Nastaliq Urdu (Google Fonts)
Date Format: DD/MM/YYYY
Number Format: 1,23,456 (Indian numbering system)
5. Offline-First Architecture
5.1 Data Flow
mermaid

No sync layer — all data is local-only by design.

5.2 Dexie.js Schema (Production-Ready)
ts
123456789101112131415161718192021222324
// db.ts
import Dexie from 'dexie';

class TailorProDB extends Dexie {
  customers: Dexie.Table<Customer, number>;
  orders: Dexie.Table<Order, number>;
  measurements: Dexie.Table<Measurement, number>;

  constructor() {
    super('TailorProDB');

5.3 Storage Limits & Performance
IndexedDB Quota: Effectively unlimited in Electron (vs. browser’s 50–80% disk limit)
Performance: Optimized for ≤10,000 records (tested on 2GB RAM Windows 10 VM)
Indexing: Queries on phone, status, dueDate are indexed
6. Electron Integration
6.1 Security Model
nodeIntegration: false
contextIsolation: true
All IPC via preload script:
ts
12345678
// preload.ts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content: string, filename: string) => 
    ipcRenderer.invoke('save-file', content, filename),
  openFile: () => ipcRenderer.invoke('open-file')
});
6.2 Main Process (main.ts)
Creates window with 1024x768 min size
Loads dist/index.html (Vite build output)
Handles file dialogs for backup/restore
Disables dev tools in production
6.3 Packaging
Format: NSIS installer (.exe)
Size: ~8 MB (with Dexie, no SQLite binary)
Auto-Update: Disabled (to honor “no internet” principle)
Icons: Custom .ico for taskbar/desktop
7. UI/UX Specifications
7.1 Layout (Responsive Desktop)
Sidebar Navigation: Customers | Orders | Backup | Settings
Header: Language toggle, app title (“Tailor Pro”)
Primary Font: Inter (English), Noto Nastaliq Urdu (Urdu)
7.2 Key Screens
Screen
Elements
Dashboard
Stats (total customers, pending orders), “Due Today” list
Add Customer
Form with photo capture (via file picker)
New Order
Customer selector → Garment template → Measurement form → Due date
Order Detail
Status timeline, measurement view/edit, notes
Backup
“Export All” button, “Import Backup” button
7.3 Accessibility
Keyboard navigable
Color contrast ≥ 4.5:1
Large touch targets (for mouse users)
8. Testing Strategy
8.1 Test Coverage
Type
Tools
Coverage
Unit
Vitest
90%+ (business logic, DB helpers)
Integration
React Testing Library
All CRUD flows
E2E
Playwright
Electron app install → create customer → export backup
Device
Windows 10 VM (2GB RAM)
Performance validation
8.2 Critical Test Cases
App launches offline ✅
Create customer → add order → view measurement ✅
Switch to Urdu → UI flips RTL ✅
Export backup → reinstall app → restore data ✅
Enter 10,000 fake orders → UI remains responsive ✅
9. Deployment & Distribution
9.1 Build Pipeline
bash
123456
# Dev
npm run dev          # React + Electron hot reload

# Production
npm run build        # Vite build
npm run package      # Electron Builder → release/win-unpacked/
9.2 Distribution Channels
Primary: Direct .exe download via Google Drive / Dropbox
Secondary: Shared via WhatsApp in tailor groups
No App Stores: Avoids review delays and fees
9.3 Versioning
Semantic versioning (v1.0.0)
Changelog included in installer
10. Maintenance & Sustainability
10.1 Zero-Cost Model
No servers → $0 operational cost
Open-source core (MIT license) → community contributions welcome
Optional: Accept JazzCash donations (non-intrusive link in About)
10.2 Future-Proofing
Modular code: DB layer abstracted → easy swap to SQLite if needed
No deprecated APIs: Uses modern Electron + Dexie
Backward compatibility: DB versioning handles schema upgrades
11. Known Limitations (Transparent Disclosure)
Limitation
Mitigation
Windows-only (for now)
macOS/Linux possible later via Electron
No multi-device sync
USB backup workaround provided
Max ~50k records
Sufficient for 20+ years of solo use
No printing
Export to PDF via browser print (Ctrl+P)
12. Appendix
12.1 Sample Measurement Template (Sherwani)
json
123456789101112
{
  "template": "sherwani",
  "fields": {
    "chest": "42",
    "waist": "38",
    "shoulder": "18",
    "armhole": "20",
    "length": "48",
    "sleeve": "24",
    "collar": "16"

12.2 Backup File Structure
json
123456789
{
  "version": "1.0",
  "timestamp": "2026-01-20T10:00:00Z",
  "data": {
    "customers": [...],
    "orders": [...],
    "measurements": [...]
  }
}
Tailor Pro is not just an app—it’s a digital darzi diary that never runs out of pages.
Built for Pakistan. Owned by the tailor. Free forever.

