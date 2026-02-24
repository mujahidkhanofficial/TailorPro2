import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetail from '@/pages/CustomerDetail';
import Orders from '@/pages/Orders';
import CreateOrder from '@/pages/CreateOrder';
import OrderDetail from '@/pages/OrderDetail';
import Workers from '@/pages/Workers';
import Backup from '@/pages/Backup';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import KarigarProgress from '@/pages/KarigarProgress';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Protected Route Component
const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? <AppLayout><Outlet /></AppLayout> : <Navigate to="/login" replace />;
};

function App() {
    const { i18n } = useTranslation();
    const language = useUIStore((state) => state.language);

    useEffect(() => {
        i18n.changeLanguage(language);
        document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language, i18n]);

    return (
        <div
            dir={language === 'ur' ? 'rtl' : 'ltr'}
            className={`h-full ${language === 'ur' ? 'font-urdu' : 'font-sans'}`}
        >
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/create" element={<CreateOrder />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/workers" element={<Workers />} />
                    <Route path="/karigar-progress" element={<KarigarProgress />} />
                    <Route path="/backup" element={<Backup />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
