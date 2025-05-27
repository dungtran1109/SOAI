import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Cookies from "js-cookie";
import RecruitmentCandidatePage from "./pages/RecruitmentCandidatePage";

const App = () => {
  const profileCookie = Cookies.get("profile");
  let user = null;
  let isAuthenticated = false;
  let isSignIn = true;

  try {
    if (profileCookie) {
      user = JSON.parse(profileCookie);
      isAuthenticated =
        user.token &&
        user.expiresAt &&
        new Date(user.expiresAt).getTime() > Date.now();
    }
  } catch (err) {
    console.error("Failed to parse profile cookie:", err);
  }

  console.log("isAuthenticated:", isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated  ? <RecruitmentCandidatePage /> : <Navigate to="/signin" />}/>
        <Route path="/signin" element={<AuthPage isSignIn={isSignIn}/>} />
        <Route path="/signup" element={<AuthPage isSignIn={!isSignIn}/>} />
      </Routes>
    </Router>
  );
};

export default App;
