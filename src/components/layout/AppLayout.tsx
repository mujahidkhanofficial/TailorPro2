import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';



import { ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
}

import { useTranslation } from 'react-i18next';

export default function AppLayout({ children }: AppLayoutProps) {
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-gray-900" dir={isUrdu ? 'rtl' : 'ltr'}>

            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col transition-all duration-300">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden glass"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
