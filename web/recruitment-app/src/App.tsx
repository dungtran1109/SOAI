import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminDashBoardPage from './pages/AdminDashBoardPage';
import AdminCVListPage from './pages/AdminCVListPage';
import { useEffect, useState } from 'react';
import { getUserRole, isAuthenticated } from './shared/helpers/authUtils';
import type { Role } from './shared/types/authTypes';
import { ToastContainer } from 'react-toastify';
import AdminUserListPage from './pages/AdminUserListPage';
import { PRIVATE_ADMIN_ROUTE, PUBLIC_ROUTE } from './shared/constants/routes';
import AdminJDListPage from './pages/AdminJDListPage';

const AppRoutes = () => {
    const location = useLocation();
    const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());
    const [role, setRole] = useState<Role>(getUserRole());

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setRole(getUserRole());
    }, [location.pathname]);

    return (
        <Routes>
            {/* Navigte to <AdminDashBoardPage /> is used for testing */}
            <Route path="/" element={isAuth && role === 'USER' ? <AdminDashBoardPage /> : <Navigate to={PUBLIC_ROUTE.signin} replace />} />

            <Route path={PUBLIC_ROUTE.signin} element={<AuthPage isSignIn={true} />} />
            <Route path={PUBLIC_ROUTE.signup} element={<AuthPage isSignIn={false} />} />

            <Route path={PRIVATE_ADMIN_ROUTE.dashboard} element={isAuth && role === 'ADMIN' ? <AdminDashBoardPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.candidateCV} element={isAuth && role === 'ADMIN' ? <AdminCVListPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.user} element={isAuth && role === 'ADMIN' ? <AdminUserListPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.job} element={isAuth && role === 'ADMIN' ? <AdminJDListPage /> : <Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => {
    return (
        <>
            <Router>
                <AppRoutes />
            </Router>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnHover theme="colored" />
        </>
    );
};

export default App;
