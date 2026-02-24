import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    language: 'en' | 'ur';
    sidebarCollapsed: boolean;
    onboardingCompleted: boolean;
    setLanguage: (lang: 'en' | 'ur') => void;
    toggleSidebar: () => void;
    completeOnboarding: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            language: 'en',
            sidebarCollapsed: false,
            onboardingCompleted: false,

            setLanguage: (lang) => set({ language: lang }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            completeOnboarding: () => set({ onboardingCompleted: true }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({
                language: state.language,
                onboardingCompleted: state.onboardingCompleted
            }),
        }
    )
);
