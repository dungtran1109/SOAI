import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminDashBoardPage from './pages/AdminDashBoardPage';
import AdminCVListPage from './pages/AdminCVListPage';
import { useEffect, useState } from 'react';
import { getUserRole, isAuthenticated } from './shared/utils/authUtils';
import type { Role } from './shared/interfaces/authInterface';
import { ToastContainer } from 'react-toastify';

const AppRoutes = () => {
    const location = useLocation();
    const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());
    const [role, setRole] = useState<Role | null>(getUserRole());

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setRole(getUserRole());
    }, [location.pathname]);

    return (
        <Routes>
            {/* Navigte to <AdminDashBoardPage /> is used for testing */}
            <Route path="/" element={isAuth && role === 'USER' ? <AdminDashBoardPage /> : <Navigate to="/signin" replace />} />

            <Route path="/signin" element={<AuthPage isSignIn={true} />} />
            <Route path="/signup" element={<AuthPage isSignIn={false} />} />

            <Route path="/admin/dashboard" element={isAuth && role === 'ADMIN' ? <AdminDashBoardPage /> : <Navigate to="/" replace />} />
            <Route path="/admin/dashboard/cv-candidate" element={isAuth && role === 'ADMIN' ? <AdminCVListPage /> : <Navigate to="/" />} />
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
