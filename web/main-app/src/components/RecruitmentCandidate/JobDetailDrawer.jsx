import "../../css/JobDetailDrawer.css";
import EndavaLogo from "../../assets/images/endava-logo.png";

const JobDetailDrawer = ({ job, onClose }) => {
  if (!job) return null;

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains("drawer-overlay")) {
      onClose();
    }
  };

  return (
    <div className="drawer-overlay" onClick={handleOutsideClick}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <img src={EndavaLogo} alt="Endava" className="drawer-logo" />
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Title */}
        <div className="drawer-top">
          <h2 className="drawer-title">{job.title}</h2>
          <p className="drawer-sub">
            Endava • Full-time • <span className="job-ref">{job.ref}</span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="drawer-body">
          {job.companyDescription?.trim() && (
            <section>
              <h4>Company Description</h4>
              <p>{job.companyDescription}</p>
            </section>
          )}

          {job.jobDescription?.trim() && (
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

          {Array.isArray(job.additionalInformation) && job.additionalInformation.length > 0 && (
            <section>
              <h4>Additional Information</h4>
              <ul>
                {job.additionalInformation.map((info, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: info }} />
                ))}
              </ul>
            </section>
          )}

          <section className="job-meta-section">
            <div className="meta-row">
              <div><strong>Location</strong><br />{job.location}</div>
              <div><strong>Hiring manager</strong><br />{job.hiringManager || "N/A"}</div>
            </div>
            <div className="meta-row">
              <div><strong>Recruiter</strong><br />{job.recruiter || "N/A"}</div>
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
