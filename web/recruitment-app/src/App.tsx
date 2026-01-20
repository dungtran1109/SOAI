import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { adminRoute, userRoute } from './routes/protectedRoutes';
import { authRoutes } from './routes/publicRoutes';
import { useSelector } from 'react-redux';
import { PUBLIC_ROUTE } from './shared/constants/routes';
import type { RootState } from './services/redux/store';
import UserLayout from './components/users/UserLayout';
import AdminLayout from './components/admins/AdminLayout';

const App = () => {
    const userAuthen = useSelector((state: RootState) => state.authenSession);

    return (
        <BrowserRouter basename="/recruitment">
            <Routes>
                <Route>
                    {authRoutes.map((route) => {
                        const Component = route.component;
                        return <Route path={route.path} element={<Component isSignin={route.isSignin} />} />;
                    })}
                </Route>

                <Route element={userAuthen.isAuthen && userAuthen.role === adminRoute.role ? <AdminLayout /> : <Navigate to={PUBLIC_ROUTE.signin} replace />}>
                    {adminRoute.routes.map((route) => {
                        const Component = route.component;
                        return <Route key={route.id} path={route.path} element={<Component />} />;
                    })}
                </Route>

                <Route element={userAuthen.isAuthen && userAuthen.role === userRoute.role ? <UserLayout /> : <Navigate to={PUBLIC_ROUTE.signin} replace />}>
                    {userRoute.routes.map((route) => {
                        const Component = route.component;
                        return <Route key={route.id} path={route.path} element={<Component />} />;
                    })}
                </Route>

                {/* Default route: redirect to signin if not authenticated, or to appropriate dashboard */}
                <Route
                    path="/"
                    element={
                        userAuthen.isAuthen ? (
                            <Navigate to={userAuthen.role === 'ADMIN' ? adminRoute.routes[0].path : userRoute.routes[0].path} replace />
                        ) : (
                            <Navigate to={PUBLIC_ROUTE.signin} replace />
                        )
                    }
                />
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to={PUBLIC_ROUTE.signin} replace />} />
            </Routes>

            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnHover theme="colored" />
        </BrowserRouter>
    );
};

export default App;
