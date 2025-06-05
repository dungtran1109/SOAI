import CalendarIcon from "../../assets/icons/calendar.png";
import LocationIcon from "../../assets/icons/location.png";

const JobCard = ({ job, logo, onClick }) => {
  return (
    <div className="job-card" onClick={() => onClick(job)}>
      <div className="job-header">
        <img src={logo} alt="Endava Logo" className="job-logo" />
        <div className="job-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-subtitle">
            Endava <span className="dot">•</span> Full-time <span className="dot">•</span>{" "}
            <span className="job-ref">{job.ref}</span>
          </p>
          <div className="job-location">
            <img src={LocationIcon} alt="Location" className="icon" />
            <span className="location-text">{job.location}</span>
          </div>
        </div>
        <div className="job-side-meta">
          {job.referral && (
            <span className="referral-badge">Referral available</span>
          )}
          <p className="job-date">
            <img src={CalendarIcon} alt="Posted date" className="icon" />
            {job.date}
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobCard;