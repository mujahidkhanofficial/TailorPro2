import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useState, useEffect } from 'react';
import { Save, Building2, Phone, MapPin, Printer, Lock } from 'lucide-react';
import { db, Settings as ShopSettings } from '@/db/database';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import PageTransition from '@/components/ui/PageTransition';
import TemplateDesigner from '@/components/settings/TemplateDesigner';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { language, setLanguage } = useUIStore();
    const isUrdu = i18n.language === 'ur';

    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    const [appVersion, setAppVersion] = useState<string>('');
    const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);

    // Shop Settings State
    const [settings, setSettings] = useState<ShopSettings>({
        shopName: 'M.R.S ٹیلرز اینڈ فیبرکس',
        address: 'گل پلازہ روڈ اپوزٹ ٹاؤن شیل مارکیٹ تارو جب',
        phone1: '0313-9003733',
        phone2: '0313-9645010',
        appTitle: 'Tailor Pro',
        updatedAt: new Date()
    });

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Title Change Verification
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [pendingTitle, setPendingTitle] = useState('');

    useEffect(() => {
        // Load App Version
        if (window.electronAPI) {
            window.electronAPI.getAppVersion().then(setAppVersion);
            window.electronAPI.getPrinters().then(setAvailablePrinters);
        }

        // Load Shop Settings
        const loadSettings = async () => {
            const savedSettings = await db.settings.toCollection().first();
            if (savedSettings) {
                setSettings(savedSettings);
            }
        };
        loadSettings();
    }, []);

    const handleLanguageChange = (lang: 'en' | 'ur') => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    const saveToDb = async (data: ShopSettings) => {
        try {
            const existing = await db.settings.toCollection().first();
            const id = existing?.id || 1;
            const passwordToSave = data.password || existing?.password;
            const finalSettings = { ...data, id, password: passwordToSave, updatedAt: new Date() };

            await db.settings.put(finalSettings);
            setSettings(finalSettings);

            // Broadcast event for Sidebar to update immediately
            window.dispatchEvent(new Event('settings-updated'));

            toast.success(t('settings.saved'));
        } catch (error) {
            console.error(error);
            toast.error(t('settings.saveError'));
        }
    };

    const handleSaveSettings = async () => {
        try {
            const existing = await db.settings.toCollection().first();

            // Check if title changed
            if (settings.appTitle !== existing?.appTitle) {
                setPendingTitle(settings.appTitle || 'Tailor Pro');
                setIsTitleModalOpen(true);
                return; // Stop here, wait for modal
            }

            saveToDb(settings);
        } catch (error) {
            console.error(error);
            toast.error(t('settings.saveError'));
        }
    };

    const confirmTitleChange = async () => {
        // Validation logic for password is handled inside ConfirmationModal via requirePassword
        // If we reach here, password was correct
        await saveToDb({ ...settings, appTitle: pendingTitle });
        setIsTitleModalOpen(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error(t('settings.fillAll'));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('settings.passwordMismatch'));
            return;
        }

        try {
            const savedSettings = await db.settings.toCollection().first();
            const actualCurrentPassword = savedSettings?.password || 'admin123';

            if (currentPassword !== actualCurrentPassword) {
                toast.error(t('settings.incorrectPassword'));
                return;
            }

            // Robust Save Logic:
            if (savedSettings && savedSettings.id) {
                // Update existing
                console.log('🔐 Updating existing settings ID:', savedSettings.id);
                await db.settings.update(savedSettings.id, {
                    password: newPassword,
                    updatedAt: new Date()
                });
                // Update local state by merging
                setSettings({ ...savedSettings, password: newPassword, updatedAt: new Date() });
            } else {
                // Create new
                console.log('🔐 Creating new settings record');
                const newSettings: ShopSettings = {
                    ...settings, // Use current form state
                    password: newPassword,
                    updatedAt: new Date()
                };
                // Ensure we don't pass an undefined ID if it's auto-increment
                const id = await db.settings.add(newSettings);
                setSettings({ ...newSettings, id });
            }

            toast.success(t('settings.passwordChanged'));

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password change error:', error);
            toast.error(t('settings.changeError'));
        }
    };

    return (
        <PageTransition className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>

            {/* Shop Settings Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {t('settings.shopDetails')}
                    </h2>
                    <button
                        onClick={handleSaveSettings}
                        className="btn btn-primary flex items-center gap-2 text-sm py-1.5"
                    >
                        <Save className="w-4 h-4" />
                        {t('settings.saveChanges')}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* App Title Input */}
                    <div className="col-span-2 space-y-2">
                        <label className="label">
                            {isUrdu ? 'ایپ کا ٹائٹل (نیا نام)' : 'App Title (Sidebar Name)'}
                            <span className="text-xs text-gray-500 ml-2 font-normal">
                                {isUrdu ? '(زیادہ سے زیادہ 15 الفاظ)' : '(Max 15 characters)'}
                            </span>
                        </label>
                        <input
                            type="text"
                            className="input font-bold text-primary-600"
                            value={settings.appTitle || ''}
                            onChange={(e) => {
                                if (e.target.value.length <= 15) {
                                    setSettings({ ...settings, appTitle: e.target.value })
                                }
                            }}
                            placeholder="Tailor Pro"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="label">{t('settings.shopName')}</label>
                        <input
                            type="text"
                            className="input font-urdu"
                            value={settings.shopName}
                            onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                            dir="auto"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="label">{t('settings.address')}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="input pl-10 font-urdu"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                dir="auto"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">{t('settings.phone1')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="input pl-10"
                                value={settings.phone1}
                                onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">{t('settings.phone2')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="input pl-10"
                                value={settings.phone2}
                                onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Configuration */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        {isUrdu ? 'لے آؤٹ ڈیزائنر' : 'Slip Layout Designer'}
                    </h2>
                    <button
                        onClick={() => setIsDesignerOpen(true)}
                        className="btn btn-secondary flex items-center gap-2 text-sm py-1.5"
                    >
                        {isUrdu ? 'ڈیزائن تبدیل کریں' : 'Edit Design'}
                    </button>
                </div>
                <p className="text-sm text-gray-500">
                    {isUrdu ? 'پرچی پر شکلیں، خانے اور عنوانات کو اپنی مرضی سے سیٹ کریں۔' : 'Visually drag and drop the measurement slip elements, shapes, and inputs.'}
                </p>
            </div>

            {/* Printer Settings */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        {t('settings.printerSettings')}
                    </h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="label">{t('settings.defaultPrinter')}</label>
                        <select
                            className="input"
                            value={settings.defaultPrinter || ''}
                            onChange={(e) => setSettings({ ...settings, defaultPrinter: e.target.value })}
                        >
                            <option value="">{t('settings.selectPrinter')}</option>
                            {availablePrinters.map((p) => (
                                <option key={p.name} value={p.name}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('settings.printerHint')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Language Selection */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${language === 'en'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-3xl mb-2 block">🇬🇧</span>
                        <span className="font-medium">English</span>
                    </button>

                    <button
                        onClick={() => handleLanguageChange('ur')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${language === 'ur'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-3xl mb-2 block">🇵🇰</span>
                        <span className="font-urdu font-medium">اردو</span>
                    </button>
                </div>
            </div>

            {/* About Section */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">{t('settings.about')}</h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20 p-2">
                            <img src="logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t('app.name')}</h3>
                            <p className="text-gray-500">{t('app.tagline')}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-gray-600">{t('settings.version')}</span>
                        <span className="font-semibold text-gray-900">v{appVersion || '1.0.0'}</span>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        {t('settings.securitySettings')}
                    </h2>
                    <button
                        onClick={handleChangePassword}
                        className="btn btn-primary flex items-center gap-2 text-sm py-1.5"
                    >
                        <Save className="w-4 h-4" />
                        {t('settings.changePassword')}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="label">{t('settings.currentPassword')}</label>
                        <input
                            type="password"
                            className="input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="label">{t('settings.newPassword')}</label>
                        <input
                            type="password"
                            className="input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="label">{t('settings.confirmPassword')}</label>
                        <input
                            type="password"
                            className="input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Modal for Title Change */}
            <ConfirmationModal
                isOpen={isTitleModalOpen}
                onClose={() => setIsTitleModalOpen(false)}
                onConfirm={confirmTitleChange}
                title={isUrdu ? 'نام کی تبدیلی کی تصدیق' : 'Confirm Title Change'}
                message={isUrdu ? 'براہ کرم ایپ کا نام تبدیل کرنے کے لیے اپنا پاس ورڈ درج کریں۔' : 'Please enter your password to change the App Title.'}
                confirmText={isUrdu ? 'ٹیبلیڈ کریں' : 'Update Title'}
                requirePassword={true}
            />

            <TemplateDesigner
                isOpen={isDesignerOpen}
                onClose={() => setIsDesignerOpen(false)}
            />

        </PageTransition>
    );
}
