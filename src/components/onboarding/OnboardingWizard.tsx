import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useCustomerStore } from '@/stores/customerStore';
import { Scissors, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface OnboardingWizardProps {
    onComplete: () => void;
    onOpenNewOrder: () => void;
}

import { createPortal } from 'react-dom';

export default function OnboardingWizard({ onComplete, onOpenNewOrder }: OnboardingWizardProps) {
    const { t, i18n } = useTranslation();
    const { setLanguage, language, completeOnboarding } = useUIStore();
    const { addCustomer } = useCustomerStore();
    const [step, setStep] = useState(1);

    // Step 2 Form Data
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLanguageSelect = (lang: 'en' | 'ur') => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !customerPhone) {
            toast.error(t('validation.required'));
            return;
        }

        setIsSubmitting(true);
        try {
            await addCustomer({
                name: customerName,
                phone: customerPhone,
                address: ''
            });
            toast.success('Customer added!');
            setStep(3);
        } catch (error) {
            console.error(error);
            toast.error('Error adding customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = () => {
        completeOnboarding();
        onComplete();
        onOpenNewOrder();
    };

    const handleSkip = () => {
        completeOnboarding();
        onComplete();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 flex">
                    <div
                        className="bg-primary-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mx-auto mb-4 text-white">
                            <Scissors className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {step === 1 && "Welcome to TailorPro"}
                            {step === 2 && "Add First Customer"}
                            {step === 3 && "You're All Set!"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {step === 1 && "Let's newer set up your experience."}
                            {step === 2 && "Who is your first customer?"}
                            {step === 3 && "Ready to take your first order?"}
                        </p>
                    </div>

                    {/* Step 1: Language */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleLanguageSelect('en')}
                                    className={`p-6 rounded-xl border-2 transition-all ${language === 'en'
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 ring-offset-2'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-4xl mb-3 block">🇬🇧</span>
                                    <span className="font-bold block text-gray-900">English</span>
                                </button>
                                <button
                                    onClick={() => handleLanguageSelect('ur')}
                                    className={`p-6 rounded-xl border-2 transition-all ${language === 'ur'
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 ring-offset-2'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-4xl mb-3 block">🇵🇰</span>
                                    <span className="font-bold block font-urdu text-xl text-gray-900">اردو</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full btn btn-primary py-3 text-lg mt-8 flex items-center justify-center gap-2 group"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Add Customer */}
                    {step === 2 && (
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="input py-3"
                                    placeholder="e.g. Ali Khan"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="input py-3"
                                    placeholder="0300-1234567"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn btn-primary py-3 text-lg mt-4 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Saving...' : 'Next Step'}
                                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(3)} // Skip adding customer
                                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
                            >
                                Skip this step
                            </button>
                        </form>
                    )}

                    {/* Step 3: Finish */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                    <Check className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-green-800">Setup Complete!</h3>
                                <p className="text-green-600 text-sm mt-1">
                                    {customerName ? `Great! ${customerName} has been added.` : "You're ready to go!"}
                                </p>
                            </div>

                            <button
                                onClick={handleFinish}
                                className="w-full btn btn-primary py-4 text-lg shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
                            >
                                <Scissors className="w-5 h-5" />
                                Create First Order
                            </button>

                            <button
                                onClick={handleSkip}
                                className="w-full text-center text-gray-500 hover:text-gray-900 font-medium"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
