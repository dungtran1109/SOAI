const JobCard = ({ job, logo }) => {
  return (
    <div className="job-card">
      <div className="job-header">
        <img src={logo} alt="Endava Logo" className="job-logo" />
        <div className="job-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-type">Full-time • {job.ref}</p>
        </div>
      </div>
      <div className="job-details">
        <p className="job-location">📍 {job.location}</p>
        <div className="job-meta">
          <p className="job-date">📅 {job.date}</p>
          {job.referral && (
            <span className="referral-badge">Referral available</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;