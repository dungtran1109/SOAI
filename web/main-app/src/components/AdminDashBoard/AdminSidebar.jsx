import { NavLink, useNavigate } from "react-router-dom";
import "../../css/AdminSidebar.css";
import SmartRecruitmentLogo from "../../assets/images/smart-recruitment-admin-logo.png";
import { logout } from "../../api/authApi";
import { FiLogOut } from "react-icons/fi";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const menu = [
    { label: "Trang chủ", path: "/admin/dashboard" },
    { label: "Tài khoản người dùng", path: "/admin/dashboard/users" },
    { label: "Hồ sơ đã nộp", path: "/admin/dashboard/cvs" },
    { label: "Lịch phỏng vấn", path: "/admin/dashboard/interviews" },
    { label: "Đợt tuyển sinh", path: "/admin/dashboard/jds" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/signin");
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar__brand">Tuyển sinh thông minh</div>

      <ul className="admin-sidebar__menu">
        {menu.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.path}
              end={item.label === "Trang chủ"}
              className={({ isActive }) =>
                isActive
                  ? "admin-sidebar__link active"
                  : "admin-sidebar__link"
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="admin-sidebar__footer">
        <img
          src={SmartRecruitmentLogo}
          alt="Admin Avatar"
          className="admin-sidebar__avatar"
        />
        <div className="admin-sidebar__account-info">
          <p className="admin-sidebar__name">Quản trị viên</p>
          <p className="admin-sidebar__email">smart.recruit.ai@gmail.com</p>
        </div>
        <button
          className="admin-sidebar__logout-btn"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;