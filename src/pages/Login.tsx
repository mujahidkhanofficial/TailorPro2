import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';
import { Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Fetch ALL settings to detect duplicates
            const allSettings = await db.settings.toArray();
            let activeSettings = allSettings[0];

            // 2. Self-Repair: If multiple records exist, keep the most recent one or merge
            if (allSettings.length > 1) {
                console.warn('Multiple settings detected. Cleaning up...');
                // Sort by ID descending (assuming higher ID is newer)
                allSettings.sort((a, b) => (b.id || 0) - (a.id || 0));
                activeSettings = allSettings[0]; // Keep the newest

                // Delete others
                const idsToDelete = allSettings.slice(1).map(s => s.id).filter(id => id !== undefined) as number[];
                await db.settings.bulkDelete(idsToDelete);
            }

            // 3. Check password
            const correctPassword = activeSettings?.password || 'admin123';
            console.log('🔐 Login Check:', {
                storedSettingsId: activeSettings?.id,
                hasStoredPassword: !!activeSettings?.password,
                usingDefault: !activeSettings?.password,
                inputPasswordLength: password.length
            });

            if (password === correctPassword) {
                login();
                toast.success(isUrdu ? 'کامیابی سے لاگ ان ہوگئے' : 'Logged in successfully');
                navigate('/');
            } else {
                toast.error(isUrdu ? 'غلط پاس ورڈ' : 'Incorrect Password');
            }
        } catch (error) {
            console.error('Login Error:', error);
            toast.error('Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-primary-600 p-8 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 p-3">
                        <img src="logo.png" alt="TailorPro Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">TailorPro</h1>
                    <p className="text-primary-100 text-sm">Professional Tailoring Management</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isUrdu ? 'پاس ورڈ درج کریں' : 'Enter Password'}
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isUrdu ? 'لاگ ان' : 'Login'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}
