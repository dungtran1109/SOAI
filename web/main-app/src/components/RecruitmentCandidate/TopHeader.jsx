import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/TopHeader.css";
import { getUserByUserName, getTokenPayload, logout } from "../../api/authApi";
import EndavaLogo from "../../assets/images/endava-logo.png";

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
      getUserByUserName(userName)
        .then((data) => {
          setUser(Array.isArray(data) ? data[0] : data);
        })
        .catch(() => setUser(null));
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
          <img src={EndavaLogo} alt="Endava Logo" className="header-logo" />
        </Link>
      </div>
      <nav className="header-center">
        <a href="#jobs">JOBS</a>
        <a href="#my-applications">MY APPLICATIONS</a>
        <a href="#my-referals">MY REFERRALS</a>
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