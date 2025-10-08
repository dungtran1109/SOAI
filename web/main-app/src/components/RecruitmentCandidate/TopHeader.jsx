import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/TopHeader.css";
import { getTokenPayload, logout } from "../../api/authApi";
import SmartRecruitmentLogo from "../../assets/images/smart-recruitment-admin-logo.png";
import { getUserSub } from "../authUtils";

const TopHeader = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user info from API using userName from token
  useEffect(() => {
    const payload = getTokenPayload();
    const userName = payload?.sub;
    if (userName) {
      const user = getUserSub();
      setUser(user);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get initials from user object
  const getInitials = (user) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.userName) return user.userName[0].toUpperCase();
    return "U";
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <Link to="/">
          <img src={SmartRecruitmentLogo} alt="Smart Recruitment" className="header-logo" />
        </Link>
      </div>
      <nav className="header-center">
        <Link to="/">JOBS</Link>
        <Link to="/my-applications">MY APPLICATIONS</Link>
        <Link to="/my-referrals">MY REFERRALS</Link>
      </nav>
      <div className="header-right" ref={avatarRef}>
        <div
          className="user-avatar"
          onClick={() => setOpen((prev) => !prev)}
          tabIndex={0}
        >
          {getInitials(user)}
        </div>
        {open && (
          <div className="user-dropdown">
            <div className="dropdown-item">My Profile</div>
            <div className="dropdown-item">My Job Alerts</div>
            <div className="dropdown-item">My Referrals</div>
            <div className="dropdown-item">Settings</div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={handleLogout}>Logout</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;