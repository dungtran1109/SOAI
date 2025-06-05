import "../../css/JobDetailDrawer.css";
import EndavaLogo from "../../assets/images/endava-logo.png";

const JobDetailDrawer = ({ job, onClose }) => {
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
          <button className="btn-primary">Apply</button>
          <button className="btn-outline">Refer a Friend</button>
          <div className="referral-note">🔗 Referral link</div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailDrawer;
