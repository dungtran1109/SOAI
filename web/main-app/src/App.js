import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import { isAuthenticated } from "./components/authUtils";
import RecruitmentCandidatePage from "./pages/RecruitmentCandidatePage";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AppRoutes = () => {
  const location = useLocation();
  const [auth, setAuth] = useState(isAuthenticated());

  useEffect(() => {
    // Re-check auth on every route change
    setAuth(isAuthenticated());
  }, [location]);

  return (
    <Routes>
      <Route
        path="/"
        element={auth ? <RecruitmentCandidatePage /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/signin"
        element={auth ? <Navigate to="/" replace /> : <AuthPage isSignIn={true} />}
      />
      <Route
        path="/signup"
        element={auth ? <Navigate to="/" replace /> : <AuthPage isSignIn={false} />}
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