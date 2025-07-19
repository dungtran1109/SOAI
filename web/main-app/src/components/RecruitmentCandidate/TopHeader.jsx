import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/TopHeader.css";
import { getUserByUserName, getTokenPayload, logout } from "../../api/authApi";
import SmartRecruitmentLogo from "../../assets/images/smart-recruitment-admin-logo.png";

const TopHeader = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <img src={SmartRecruitmentLogo} alt="Logo tuyển sinh" className="header-logo" />
        </Link>
      </div>
      <nav className="header-center">
        <a href="#jobs">DANH SÁCH TUYỂN SINH</a>
        <a href="#my-applications">HỒ SƠ CỦA TÔI</a>
        <a href="#my-referals">GIỚI THIỆU CỦA TÔI</a>
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
            <div className="dropdown-item">Thông tin cá nhân</div>
            <div className="dropdown-item">Thông báo tuyển sinh</div>
            <div className="dropdown-item">Giới thiệu của tôi</div>
            <div className="dropdown-item">Cài đặt</div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={handleLogout}>Đăng xuất</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;