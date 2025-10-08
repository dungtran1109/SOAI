import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

import AuthPage from "./pages/AuthPage";
import RecruitmentCandidatePage from "./pages/RecruitmentCandidatePage";
import AdminDashBoardPage from "./pages/AdminPage";
import AdminCVListPage from "./pages/AdminCVListPage";
import AdminInterviewListPage from "./pages/AdminInterviewListPage";
import AdminJDListPage from "./pages/AdminJDListPage";
import AdminUserListPage from "./pages/AdminUserListPage";
import AdminLayout from "./components/AdminDashBoard/AdminLayout";

import { isAuthenticated, getUserRole } from "./components/authUtils";
import "react-toastify/dist/ReactToastify.css";
import CandidateApplication from "./components/RecruitmentCandidate/CandidateApplication";
import CandidateReferrals from "./components/RecruitmentCandidate/CandidateReferrals";

const AppRoutes = () => {
  const location = useLocation();
  const [auth, setAuth] = useState(isAuthenticated());
  const [role, setRole] = useState(getUserRole());

  useEffect(() => {
    setAuth(isAuthenticated());
    setRole(getUserRole());
  }, [location]);

  return (
    <Routes>
      {/* Candidate Page: USER only */}
      <Route
        path="/"
        element={
          auth && role === "USER" ? (
            <RecruitmentCandidatePage />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      <Route
        path="/my-applications"
        element={
          auth && role === "USER" ? (
            <CandidateApplication />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      <Route
        path="/my-referrals"
        element={
          auth && role === "USER" ? (
            <CandidateReferrals />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      {/* Shared Auth Routes */}
      <Route
        path="/signin"
        element={
          auth ? (
            role === "ADMIN" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <AuthPage isSignIn={true} />
          )
        }
      />
      <Route
        path="/signup"
        element={
          auth ? (
            role === "ADMIN" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <AuthPage isSignIn={false} />
          )
        }
      />

      {/* Admin Routes (ADMIN only) */}
      <Route
        path="/admin/dashboard"
        element={
          auth && role === "ADMIN" ? (
            <AdminDashBoardPage />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/cvs"
        element={
          auth && role === "ADMIN" ? (
            <AdminLayout>
              <AdminCVListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/interviews"
        element={
          auth && role === "ADMIN" ? (
            <AdminLayout>
              <AdminInterviewListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/jds"
        element={
          auth && role === "ADMIN" ? (
            <AdminLayout>
              <AdminJDListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard/users"
        element={
          auth && role === "ADMIN" ? (
            <AdminLayout>
              <AdminUserListPage />
            </AdminLayout>
          ) : (
            <Navigate to="/signin" replace />
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