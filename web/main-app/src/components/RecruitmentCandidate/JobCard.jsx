import CalendarIcon from "../../assets/icons/calendar.png";
import LocationIcon from "../../assets/icons/location.png";

const JobCard = ({ job, logo, onClick }) => {
  const {
    title,
    position,
    location = "Unknown location",
    ref,
    referral_code,
    referral = false,
    date,
    datetime,
  } = job;

  const displayDate = date
    ? date
    : datetime
    ? new Date(datetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "N/A";

  const displayRef = ref || referral_code || "N/A";
  const displayTitle = title || position || "Untitled Position";

  return (
    <div className="job-card" onClick={() => onClick?.(job)}>
      <div className="job-header">
        <img src={logo} alt="Endava Logo" className="job-logo" />

        <div className="job-info">
          <h3 className="job-title">{displayTitle}</h3>
          <p className="job-subtitle">
            Endava <span className="dot">•</span> Full-time{" "}
            <span className="dot">•</span>{" "}
            <span className="job-ref">{displayRef}</span>
          </p>
          <div className="job-location">
            <img src={LocationIcon} alt="Location" className="icon" />
            <span className="location-text">{location}</span>
          </div>
        </div>

        <div className="job-side-meta">
          {referral && <span className="referral-badge">Referral available</span>}
          <p className="job-date">
            <img src={CalendarIcon} alt="Posted date" className="icon" />
            {displayDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobCard;