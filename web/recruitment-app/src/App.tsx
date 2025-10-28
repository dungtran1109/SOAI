import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminDashBoardPage from './pages/AdminDashBoardPage';
import AdminCVListPage from './pages/AdminCVListPage';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/signin" replace />} />
                <Route path="/signin" element={<AuthPage isSignIn={true} />} />
                <Route path="/signup" element={<AuthPage isSignIn={false} />} />

                <Route path="/admin/dashboard" element={<AdminDashBoardPage />} />
                <Route path="/admin/dashboard/cv-candidate" element={<AdminCVListPage />} />
            </Routes>
        </Router>
    );
};

const App = () => {
    return <AppRoutes />;
};

export default App;
