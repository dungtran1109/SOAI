import React, { useEffect, useState } from "react";
import { getAllAccounts, deleteAccount } from "../../api/authApi";
import { FaUserCircle } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { HiUser } from "react-icons/hi";
import { FiTrash2 } from "react-icons/fi";
import "../../css/AdminUserList.css";

const AdminUserList = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const result = await getAllAccounts();
      setUsers(result || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (accId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) {
      try {
        await deleteAccount(accId);
        fetchUsers();
      } catch (err) {
        console.error("Failed to delete account:", err);
      }
    }
  };

  return (
    <div className="admin-user-list">
      <h2 className="admin-user-list__title">Danh sách tài khoản người dùng</h2>
      <table className="admin-user-list__table">
        <thead>
          <tr>
            <th>Thông tin người dùng</th>
            <th>Vai trò</th>
            <th>Ngày đăng ký</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.accId}>
              <td className="admin-user-list__user-cell">
                <div className="admin-user-list__user">
                  <FaUserCircle size={36} className="admin-user-list__avatar" />
                  <div className="admin-user-list__user-info">
                    <div className="admin-user-list__name">{u.userName}</div>
                    <div className="admin-user-list__email">ID: {u.accId}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`admin-user-list__role-badge ${u.role.toLowerCase()}`}>
                  {u.role === "ADMIN" ? (
                    <MdAdminPanelSettings className="badge-icon" />
                  ) : (
                    <HiUser className="badge-icon" />
                  )}
                  {u.role}
                </span>
              </td>
              <td>{new Date(u.createAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="admin-user-list__delete-btn"
                  onClick={() => handleDelete(u.accId)}
                  title="Delete account"
                >
                  <FiTrash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserList;
