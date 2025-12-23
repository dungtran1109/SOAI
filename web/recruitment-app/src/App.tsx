import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getUserRole, isAuthenticated } from './shared/helpers/authUtils';
import { PRIVATE_ADMIN_ROUTE, PUBLIC_ROUTE } from './shared/constants/routes';
import type { Role } from './shared/types/authTypes';
import AuthPage from './pages/AuthPage';
import AdminCVPage from './pages/AdminCVPage';
import AdminJDPage from './pages/AdminJDPage';
import AdminAccountPage from './pages/AdminAccountPage';
import AdminInterviewPage from './pages/AdminInterviewPage';
import AdminDashBoardPage from './pages/AdminDashBoardPage';
import UserJobPage from './pages/UserJobPage';
import UserHeader from './components/users/UserHeader';
import UserProfile from './pages/UserProfile';

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
            {/* Navigte to <AdminDashBoardPage /> is used for testing - will be removed later*/}
            <Route path="/" element={isAuth && role === 'ADMIN' ? <AdminDashBoardPage /> : <Navigate to={PUBLIC_ROUTE.signin} replace />} />

            {/* TOTO: Remove hard-code routes after adding user pages */}
            <Route path={PUBLIC_ROUTE.signin} element={<AuthPage isSignin={true} />} />
            <Route path={PUBLIC_ROUTE.signup} element={<AuthPage isSignin={false} />} />

            {/* TODO: Handle PUBLIC_ROUTE.profile as a private route*/}
            <Route element={<UserHeader />}>
                <Route path={PUBLIC_ROUTE.openJob} element={<UserJobPage />} />
                <Route path={PUBLIC_ROUTE.profile} element={<UserProfile />} />
            </Route>

            {/* TOTO: Remove hard-code routes after adding user pages*/}
            <Route path={PRIVATE_ADMIN_ROUTE.dashboard} element={isAuth && role === 'ADMIN' ? <AdminDashBoardPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.cv} element={isAuth && role === 'ADMIN' ? <AdminCVPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.job} element={isAuth && role === 'ADMIN' ? <AdminJDPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.interview} element={isAuth && role === 'ADMIN' ? <AdminInterviewPage /> : <Navigate to="/" replace />} />
            <Route path={PRIVATE_ADMIN_ROUTE.account} element={isAuth && role === 'ADMIN' ? <AdminAccountPage /> : <Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnHover theme="colored" />
        </BrowserRouter>
    );
};

export default App;
