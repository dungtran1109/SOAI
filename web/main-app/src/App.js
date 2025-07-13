import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

import AuthPage from "./pages/AuthPage";
import RecruitmentCandidatePage from "./pages/RecruitmentCandidatePage";
import AdminDashBoardPage from "./pages/AdminPage";
import AdminCVListPage from "./pages/AdminCVListPage";
import AdminInterviewListPage from "./pages/AdminInterviewListPage";
import AdminJDListPage from "./pages/AdminJDListPage";
import AdminLayout from "./components/AdminDashBoard/AdminLayout";

import { isAuthenticated } from "./components/authUtils";
import "react-toastify/dist/ReactToastify.css";
import AdminUserListPage from "./pages/AdminUserListPage";

const AppRoutes = () => {
  const location = useLocation();
  const [auth, setAuth] = useState(isAuthenticated());

  useEffect(() => {
    // Re-check auth on every route change
    setAuth(isAuthenticated());
  }, [location]);

  return (
    <Routes>
      {/* Public-facing recruitment page */}
      <Route path="/" element={<RecruitmentCandidatePage />} />

      {/* Auth routes */}
      <Route
        path="/admin/signin"
        element={auth ? <Navigate to="/admin/dashboard" replace /> : <AuthPage isSignIn={true} />}
      />
      <Route
        path="/admin/signup"
        element={auth ? <Navigate to="/admin/dashboard" replace /> : <AuthPage isSignIn={false} />}
      />

      {/* Admin Dashboard Root */}
      <Route
        path="/admin/dashboard"
        element={auth ? <AdminDashBoardPage /> : <Navigate to="/admin/signin" replace />}
      />

      {/* Admin Dashboard Subpages with Layout Wrapper */}
      <Route
        path="/admin/dashboard/cvs"
        element={
          auth ? (
            <AdminLayout>
              <AdminCVListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/admin/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/interviews"
        element={
          auth ? (
            <AdminLayout>
              <AdminInterviewListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/admin/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/jds"
        element={
          auth ? (
            <AdminLayout>
              <AdminJDListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/admin/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/users"
        element={
          auth ? (
            <AdminLayout>
              <AdminUserListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/admin/signin" replace />
          )
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AppRoutes />
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
};

export default App;
