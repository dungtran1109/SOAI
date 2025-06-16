import { useRef, useState } from "react";
import "../../css/JobDetailDrawer.css";
import EndavaLogo from "../../assets/images/endava-logo.png";
import { uploadCV } from "../../api/cvApi";
import { toast } from "react-toastify";

const JobDetailDrawer = ({ job, onClose }) => {
  const fileInputRef = useRef();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!job) return null;

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains("drawer-overlay")) {
      onClose();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
  };

  const renderAdditionalInformation = (info) => {
    if (!info || typeof info !== "object" || Array.isArray(info)) return null;

    return (
      <section>
        <h4>Additional Information</h4>
        {Object.entries(info).map(([category, items], idx) => (
          <div key={idx} className="additional-info-group">
            <strong className="category-title">
              {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
            </strong>
            <ul className="category-list">
              {Array.isArray(items) ? items.map((item, i) => (
                <li key={i}>{item}</li>
              )) : (
                <li>{String(items)}</li>
              )}
            </ul>
          </div>
        ))}
      </section>
    );
  };

  // Handle CV upload when Apply is clicked
  const handleApplyClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file.name);
    setIsUploading(true);
    try {
      const MAX_SIZE =5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_SIZE) {
        throw new Error("File size exceeds 5 MB limit.");
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        throw new Error("Invalid file type. Only PDF and Word documents are allowed.");
      }
      const response = await uploadCV(file, job.position || job.title || "Unknown Position");
      toast.success(response?.message || `CV uploaded successfully!`);
    } catch (err) {
      toast.error(err?.message || "Failed to upload CV.");
    }
    setIsUploading(false);
    e.target.value = ""; // Reset input so same file can be selected again
  };

  return (
    <div className="drawer-overlay" onClick={handleOutsideClick}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <img src={EndavaLogo} alt="Endava" className="drawer-logo" />
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Title */}
        <div className="drawer-top">
          <h2 className="drawer-title">
            {job.position || job.title || "Untitled Position"}
          </h2>
          <p className="drawer-sub">
            Endava • {job.level || "N/A"} •{" "}
            <span className="job-ref">
              {job.referral_code || job.ref || "N/A"}
            </span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="drawer-body">
          {!!job.companyDescription?.trim() && (
            <section>
              <h4>Company Description</h4>
              <p>{job.companyDescription}</p>
            </section>
          )}

          {!!job.jobDescription?.trim() && (
            <section>
              <h4>Job Description</h4>
              <p>{job.jobDescription}</p>
            </section>
          )}

          {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
            <section>
              <h4>Responsibilities</h4>
              <ul>
                {job.responsibilities.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.qualifications) && job.qualifications.length > 0 && (
            <section>
              <h4>Qualifications</h4>
              <ul>
                {job.qualifications.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.skills_required) && job.skills_required.length > 0 && (
            <section>
              <h4>Skills Required</h4>
              <ul>
                {job.skills_required.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Grouped Additional Info */}
          {renderAdditionalInformation(job.additionalInformation)}

          {/* Meta info */}
          <section className="job-meta-section">
            <div className="meta-row">
              <div>
                <strong>Location</strong>
                <br />
                {job.location || "N/A"}
              </div>
              <div>
                <strong>Hiring Manager</strong>
                <br />
                {job.hiringManager || "N/A"}
              </div>
            </div>
            <div className="meta-row">
              <div>
                <strong>Recruiter</strong>
                <br />
                {job.recruiter || "N/A"}
              </div>
              <div>
                <strong>Posted On</strong>
                <br />
                {formatDate(job.datetime)}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            className="btn-primary"
            onClick={handleApplyClick}
            disabled={isUploading}
            aria-label="Apply for this job"
          >
            {isUploading ? (
              <span className="spinner" aria-label="Uploading"></span>
            ) : (
              "Apply"
            )}
          </button>
          <button className="btn-outline" aria-label="Refer a Friend">Refer a Friend</button>
          <div className="referral-note">🔗 Referral link</div>
          {selectedFile && (
            <div className="selected-file" style={{ marginTop: 8, fontSize: 13 }}>
              Selected file: <strong>{selectedFile}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailDrawer;