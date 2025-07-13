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

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async (query = "") => {
    try {
      const data = await listCVsByPosition(query);
      setCVs(data || []);
    } catch (error) {
      console.error("Failed to fetch CVs:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCVs(search);
  };

  const handleApprove = async (id) => {
    await approveCV(id);
    fetchCVs();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this CV?")) {
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
      console.error("Failed to update CV:", err);
    }
  };

  return (
    <div className="admin-cv-table">
      <div className="admin-cv-table__header">
        <div className="admin-cv-table__header-left">
          <h2 className="admin-cv-table__title">All CVs</h2>
          <p className="admin-cv-table__subtitle">
            Monitor submitted CVs below.
          </p>
        </div>
        <div className="admin-cv-table__header-right">
          <form onSubmit={handleSearch} className="admin-cv-table__search-form">
            <input
              type="text"
              className="admin-cv-table__search"
              placeholder="Search by position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>
      </div>

      <table className="admin-cv-table__content">
        <thead>
          <tr>
            <th>Candidate Name</th>
            <th>Position</th>
            <th>Status</th>
            <th>Email</th>
            {actionsEnabled && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {cvs.map((cv) => (
            <tr key={cv.id}>
              <td>{cv.candidate_name}</td>
              <td>{cv.matched_position}</td>
              <td>
                <span className={`status-badge status-${cv.status.toLowerCase()}`}>
                  {cv.status}
                </span>
              </td>
              <td>{cv.email || "N/A"}</td>
              {actionsEnabled && (
                <td>
                  <div className="admin-cv-table__action-group">
                    <button
                      className="admin-cv-table__icon-btn"
                      onClick={() => handleView(cv)}
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="admin-cv-table__icon-btn"
                      onClick={() => handleEdit(cv)}
                      title="Edit"
                    >
                      <FaPen />
                    </button>
                    <button
                      className="admin-cv-table__icon-btn delete"
                      onClick={() => handleDelete(cv.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                    {cv.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(cv.id)}
                        className="admin-cv-table__approve-btn"
                      >
                        Approve
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
            <h3>CV Details</h3>
            <p><strong>Name:</strong> {selectedCV.candidate_name}</p>
            <p><strong>Email:</strong> {selectedCV.email}</p>
            <p><strong>Position:</strong> {selectedCV.matched_position}</p>
            <p><strong>Status:</strong> {selectedCV.status}</p>
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
            <h3>Edit CV</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Name:
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
                Position:
                <input
                  type="text"
                  value={editCV.matched_position}
                  onChange={(e) =>
                    setEditCV({ ...editCV, matched_position: e.target.value })
                  }
                />
              </label>
              <label>
                Status:
                <select
                  value={editCV.status}
                  onChange={(e) =>
                    setEditCV({ ...editCV, status: e.target.value })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
              <div style={{ marginTop: "12px" }}>
                <button type="submit" className="admin-cv-table__approve-btn">
                  Save Changes
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