import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminLayout from './components/admins/AdminLayout';
import AdminDashBoardPage from './pages/AdminDashBoardPage';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/signin" replace />} />
                <Route path="/signin" element={<AuthPage isSignIn={true} />} />
                <Route path="/signup" element={<AuthPage isSignIn={false} />} />

                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminLayout>
                            <AdminDashBoardPage />
                        </AdminLayout>
                    }
                />
            </Routes>
        </Router>
    );
};

const App = () => {
    return <AppRoutes />;
};

export default App;
