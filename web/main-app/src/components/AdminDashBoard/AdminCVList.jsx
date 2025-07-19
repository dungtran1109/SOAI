import React, { useEffect, useState } from "react";
import {
  listCVsByPosition,
  deleteCV,
  approveCV,
  updateCV,
  getCVPreviewUrl,
} from "../../api/cvApi";
import { FaTrash, FaPen, FaEye } from "react-icons/fa";
import "../../css/AdminCVList.css";

const AdminCVList = ({ actionsEnabled = true }) => {
  const [cvs, setCVs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCV, setSelectedCV] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCV, setEditCV] = useState(null);
  const [sortByScore, setSortByScore] = useState(false);
  const [minScore, setMinScore] = useState("");

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async (query = "") => {
    try {
      const data = await listCVsByPosition(query);
      setCVs(data || []);
    } catch (error) {
      console.error("Không thể tải danh sách CV:", error);
    }
  };

  const handleApprove = async (id) => {
    await approveCV(id);
    fetchCVs();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa CV này?")) {
      await deleteCV(id);
      fetchCVs();
    }
  };

  const handleView = (cv) => {
    setSelectedCV(cv);
    setShowModal(true);
  };

  const handleEdit = (cv) => {
    setEditCV({ ...cv });
    setEditMode(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCV(editCV.id, editCV);
      setEditMode(false);
      fetchCVs();
    } catch (err) {
      console.error("Cập nhật CV thất bại:", err);
    }
  };

  const filteredCVs = cvs
  .filter((cv) => {
    try {
      const regex = new RegExp(search, "i");
      const matchesName = regex.test(cv.candidate_name);
      const meetsMinScore =
        minScore === "" || (cv.matched_score ?? 0) >= parseFloat(minScore);
      return matchesName && meetsMinScore;
    } catch (err) {
      return true;
    }
  })
  .sort((a, b) => {
    if (sortByScore) {
      return (b.matched_score || 0) - (a.matched_score || 0);
    }
    return 0;
  });

  return (
    <div className="admin-cv-table">
      <div className="admin-cv-table__header">
        <div className="admin-cv-table__header-left">
          <h2 className="admin-cv-table__title">Danh sách hồ sơ</h2>
          <p className="admin-cv-table__subtitle">
            Quản lý tất cả CV đã nộp vào hệ thống.
          </p>
        </div>
        <div className="admin-cv-table__header-right">
          <button
            className="admin-cv-table__approve-btn"
            style={{ marginLeft: '12px' }}
            onClick={() => setSortByScore(!sortByScore)}
          >
            Sắp xếp theo điểm {sortByScore ? '▲' : '▼'}
          </button>
          <input
            type="text"
            className="admin-cv-table__search-input"
            placeholder="Tìm theo tên học sinh ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="number"
            className="admin-cv-table__minscore-input"
            placeholder="Điểm tối thiểu"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </div>
      </div>

      <table className="admin-cv-table__content">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Vị trí ứng tuyển</th>
            <th>Trạng thái</th>
            <th>Email</th>
            <th>Điểm</th>
            {actionsEnabled && <th>Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {filteredCVs.map((cv) => (
            <tr key={cv.id}>
              <td>{cv.candidate_name}</td>
              <td>{cv.matched_position}</td>
              <td>
                <span className={`status-badge status-${cv.status.toLowerCase()}`}>
                  {cv.status}
                </span>
              </td>
              <td>{cv.email || "N/A"}</td>
              <td>{cv.matched_score ?? "N/A"}</td>
              {actionsEnabled && (
                <td>
                  <div className="admin-cv-table__action-group">
                    <button
                      className="admin-cv-table__icon-btn"
                      onClick={() => handleView(cv)}
                      title="Xem"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="admin-cv-table__icon-btn"
                      onClick={() => handleEdit(cv)}
                      title="Chỉnh sửa"
                    >
                      <FaPen />
                    </button>
                    <button
                      className="admin-cv-table__icon-btn delete"
                      onClick={() => handleDelete(cv.id)}
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                    {cv.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(cv.id)}
                        className="admin-cv-table__approve-btn"
                      >
                        Duyệt hồ sơ
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Modal */}
      {showModal && selectedCV && actionsEnabled && (
        <div className="admin-cv-modal__overlay" onClick={() => setShowModal(false)}>
          <div className="admin-cv-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-cv-modal__close" onClick={() => setShowModal(false)}>×</button>
            <h3>Chi tiết hồ sơ</h3>
            <p><strong>Họ tên:</strong> {selectedCV.candidate_name}</p>
            <p><strong>Email:</strong> {selectedCV.email}</p>
            <p><strong>Vị trí:</strong> {selectedCV.matched_position}</p>
            <p><strong>Trạng thái:</strong> {selectedCV.status === "Accepted" ? "Đã duyệt" : selectedCV.status === "Rejected" ? "Từ chối" : "Đang chờ"}</p>
            <p><strong>Điểm:</strong> {selectedCV.matched_score ?? "N/A"}</p>
            <div className="admin-cv-preview__iframe-container" style={{ marginTop: "1rem" }}>
              <iframe
                src={getCVPreviewUrl(selectedCV.id)}
                title="CV Preview"
                width="100%"
                height="600px"
                style={{ border: "1px solid #ccc" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMode && editCV && actionsEnabled && (
        <div className="admin-cv-modal__overlay" onClick={() => setEditMode(false)}>
          <div className="admin-cv-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-cv-modal__close" onClick={() => setEditMode(false)}>×</button>
            <h3>Chỉnh sửa hồ sơ</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Họ tên:
                <input
                  type="text"
                  value={editCV.candidate_name}
                  onChange={(e) =>
                    setEditCV({ ...editCV, candidate_name: e.target.value })
                  }
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={editCV.email}
                  onChange={(e) =>
                    setEditCV({ ...editCV, email: e.target.value })
                  }
                />
              </label>
              <label>
                Điểm:
                <input
                  type="number"
                  value={editCV.matched_score}
                  onChange={(e) =>
                    setEditCV({ ...editCV, matched_score: parseInt(e.target.value, 10) })
                  }
                />
              </label>
              <label>
                Vị trí:
                <input
                  type="text"
                  value={editCV.matched_position}
                  onChange={(e) =>
                    setEditCV({ ...editCV, matched_position: e.target.value })
                  }
                />
              </label>
              <label>
                Trạng thái:
                <select
                  value={editCV.status}
                  onChange={(e) =>
                    setEditCV({ ...editCV, status: e.target.value })
                  }
                >
                  <option value="Pending">Đang chờ</option>
                  <option value="Accepted">Đã duyệt</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </label>
              <div style={{ marginTop: "12px" }}>
                <button type="submit" className="admin-cv-table__approve-btn">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCVList;
