import React, { useEffect, useState } from "react";
import {
  getAllJD,
  editJD,
  deleteJD,
  createJD,
  uploadJDFile,
  getJDPreviewUrl,
} from "../../api/jdApi";
import { FaEye, FaPen, FaTrash, FaFilePdf } from "react-icons/fa";
import "../../css/AdminJDList.css";

const emptyJD = {
  position: "",
  level: "",
  location: "",
  experience_required: "",
  job_description: "",
  qualifications: [],
  responsibilities: [],
  skills_required: [],
  recruiter: "",
  hiring_manager: "",
  referral: false,
  referral_code: "",
  company_description: "",
  additional_information: {},
};

const AdminJDList = ({ actionsEnabled = true }) => {
  const [jds, setJds] = useState([]);
  const [selectedJD, setSelectedJD] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formJD, setFormJD] = useState(emptyJD);
  const [showCreate, setShowCreate] = useState(false);
  const [previewJDUrl, setPreviewJDUrl] = useState(null);

  const fetchJDs = async () => {
    try {
      const data = await getAllJD();
      setJds(data || []);
    } catch (error) {
      console.error("Failed to fetch JDs:", error);
    }
  };

  useEffect(() => {
    fetchJDs();
  }, []);

  const handleViewDetails = (jd) => {
    setSelectedJD(jd);
    setShowModal(true);
    setEditMode(false);
  };

  const handleEdit = (jd) => {
    setFormJD({
      ...jd,
      qualifications: jd.qualifications || [],
      responsibilities: jd.responsibilities || [],
      skills_required: Array.isArray(jd.skills_required)
        ? jd.skills_required
        : JSON.parse(jd.skills_required || "[]"),
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (jdId) => {
    if (window.confirm("Are you sure you want to delete this JD?")) {
      await deleteJD(jdId);
      fetchJDs();
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormJD((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (name, value) => {
    setFormJD((prev) => ({
      ...prev,
      [name]: value.split(",").map((v) => v.trim()).filter(Boolean),
    }));
  };

  const handleSave = async () => {
    await editJD(formJD.id, formJD);
    setShowModal(false);
    fetchJDs();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createJD(formJD);
    setShowCreate(false);
    fetchJDs();
  };

  const handleUploadJSONFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadJDFile(file);
      fetchJDs();
      alert("JD JSON file uploaded successfully!");
    } catch (err) {
      alert("Failed to upload JD JSON file: " + err.message);
    }
  };

  const handlePreviewJD = (jdId) => {
    setPreviewJDUrl(getJDPreviewUrl(jdId));
  };

  return (
    <div className="admin-jd-list">
      <div className="admin-jd-list__header">
        <div className="admin-jd-list__header-left">
          <span className="admin-jd-list__header-title">All Job Descriptions</span>
        </div>

        {actionsEnabled && (
          <div className="admin-jd-list__header-actions">
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              id="jd-upload-input"
              onChange={handleUploadJSONFile}
            />
            <label htmlFor="jd-upload-input" className="admin-jd-list__upload-btn">
              Upload JSON
            </label>
            <button
              className="admin-jd-list__create-btn"
              onClick={() => {
                setFormJD(emptyJD);
                setShowCreate(true);
              }}
            >
              + Add JD
            </button>
          </div>
        )}
      </div>

      <ul className="admin-jd-list__items">
        {jds.map((jd) => (
          <li key={jd.id} className="admin-jd-list__item">
            <div>
              <p className="admin-jd-list__title">{jd.position}</p>
              <p className="admin-jd-list__created">
                Created At:{" "}
                {jd.datetime ? new Date(jd.datetime).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="admin-jd-list__actions">
              {actionsEnabled && (
                <>
                  <button title="View" onClick={() => handleViewDetails(jd)}>
                    <FaEye />
                  </button>
                  <button title="Edit" onClick={() => handleEdit(jd)}>
                    <FaPen />
                  </button>
                  <button title="Delete" onClick={() => handleDelete(jd.id)}>
                    <FaTrash color="#e63946" />
                  </button>
                  <button title="Preview JD" onClick={() => handlePreviewJD(jd.id)}>
                    <FaFilePdf />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(showModal || showCreate) && (
        <div
          className="admin-jd-list__modal-overlay"
          onClick={() => {
            setShowModal(false);
            setEditMode(false);
            setShowCreate(false);
          }}
        >
          <div
            className="admin-jd-list__modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="admin-jd-list__modal-close"
              onClick={() => {
                setShowModal(false);
                setEditMode(false);
                setShowCreate(false);
              }}
            >
              ×
            </button>
            {editMode || showCreate ? (
              <form
                className="admin-jd-list__modal-form"
                onSubmit={
                  showCreate
                    ? handleCreate
                    : (e) => {
                        e.preventDefault();
                        handleSave();
                      }
                }
                autoComplete="off"
              >
                <h2>{showCreate ? "Create JD" : "Edit JD"}</h2>
                {/* Form Fields */}
                {[
                  { label: "Position", name: "position" },
                  { label: "Level", name: "level" },
                  { label: "Location", name: "location" },
                  { label: "Experience Required", name: "experience_required" },
                  { label: "Recruiter", name: "recruiter" },
                  { label: "Hiring Manager", name: "hiring_manager" },
                  { label: "Referral Code", name: "referral_code" },
                ].map((field) => (
                  <div key={field.name} className="admin-jd-list__form-group">
                    <label>{field.label}</label>
                    <input
                      name={field.name}
                      value={formJD[field.name]}
                      onChange={handleFormChange}
                    />
                  </div>
                ))}

                <div className="admin-jd-list__form-group">
                  <label>Job Description</label>
                  <textarea
                    name="job_description"
                    value={formJD.job_description}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>

                {["qualifications", "responsibilities", "skills_required"].map((arrField) => (
                  <div key={arrField} className="admin-jd-list__form-group">
                    <label>{arrField.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</label>
                    <input
                      name={arrField}
                      value={formJD[arrField].join(", ")}
                      onChange={(e) => handleArrayChange(arrField, e.target.value)}
                    />
                  </div>
                ))}

                <div className="admin-jd-list__form-group admin-jd-list__form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="referral"
                      checked={formJD.referral}
                      onChange={handleFormChange}
                    />
                    Referral
                  </label>
                </div>

                <div className="admin-jd-list__form-group">
                  <label>Company Description</label>
                  <textarea
                    name="company_description"
                    value={formJD.company_description}
                    onChange={handleFormChange}
                    rows={2}
                  />
                </div>

                <button type="submit" className="admin-jd-list__save-btn">
                  {showCreate ? "Create" : "Save"}
                </button>
              </form>
            ) : (
              <div className="admin-jd-list__modal-details">
                <h2>{selectedJD.position}</h2>
                <p><strong>Level:</strong> {selectedJD.level}</p>
                <p><strong>Location:</strong> {selectedJD.location}</p>
                <p><strong>Experience Required:</strong> {selectedJD.experience_required}</p>
                <p><strong>Recruiter:</strong> {selectedJD.recruiter}</p>
                <p><strong>Hiring Manager:</strong> {selectedJD.hiring_manager}</p>
                <p><strong>Referral:</strong> {selectedJD.referral ? "Yes" : "No"}</p>
                <p><strong>Referral Code:</strong> {selectedJD.referral_code}</p>
                <p><strong>Company Description:</strong> {selectedJD.company_description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {previewJDUrl && (
        <div className="admin-jd-preview__overlay" onClick={() => setPreviewJDUrl(null)}>
          <div className="admin-jd-preview__modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-jd-preview__close" onClick={() => setPreviewJDUrl(null)}>
              ×
            </button>
            <h3>Job Description Preview</h3>
            <iframe
              src={previewJDUrl}
              title="JD Preview"
              width="100%"
              height="600px"
              style={{ border: "1px solid #ccc" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJDList;