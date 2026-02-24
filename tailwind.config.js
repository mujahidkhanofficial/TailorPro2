/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                urdu: ['"NotoNastaliqUrdu"', 'serif'],
            },
            colors: {
                // Professional Slate Palette (Replacing defaults)
                gray: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Deep Indigo Brand (More premium than standard blue)
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5', // Brand Primary
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                secondary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                },
                subtle: '#94a3b8',
                surface: '#ffffff',
                background: '#f8fafc', // Slate-50
                sidebar: '#0f172a',    // Slate-900 (Dark Sidebar)
                sidebarHover: '#1e293b',

                success: {
                    500: '#10b981', // Emerald
                    600: '#059669',
                    50: '#ecfdf5',
                },
                warning: {
                    500: '#f59e0b', // Amber
                    600: '#d97706',
                    50: '#fffbeb',
                },
                danger: {
                    400: '#f87171',
                    500: '#ef4444', // Red
                    600: '#dc2626',
                    700: '#b91c1c',
                    50: '#fef2f2',
                },
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
                'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.08)',
            }
        },
    },
    plugins: [],
}
