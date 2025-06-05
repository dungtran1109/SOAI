import { useEffect, useState, useMemo } from "react";
import "../../css/RecruitmentCandidate.css";
import EndavaLogo from "../../assets/images/endava-logo.png";
import NotificationIcon from "../../assets/icons/notification.png";
import FilterIcon from "../../assets/icons/filter.png";
import JobCard from "./JobCard";
import TopHeader from "./TopHeader";
import JobDetailDrawer from "./JobDetailDrawer";
import { getAllJD } from "../../api/jdApi";

const Candidate = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [referralOnly, setReferralOnly] = useState(false);
  const [location, setLocation] = useState("All");
  const [experience, setExperience] = useState("All");
  const [showRefModal, setShowRefModal] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState("");
  const [filteredByRef, setFilteredByRef] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getAllJD();
        console.log("[DEBUG] Raw jobs from API:", jobs);

        const formattedJobs = jobs.map((job) => ({
          id: job.id,
          title: job.position || "Untitled Position",
          location: job.location || "Unknown location",
          date: job.datetime
            ? new Date(job.datetime).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
            : "N/A",
          datetime: job.datetime || null,
          referral: job.referral || false,
          ref: typeof job.referral_code === "string" ? job.referral_code : null,
          experience_required: String(job.experience_required || ""),
          level: job.level || "N/A",
          companyDescription: job.company_description || "",
          jobDescription: job.job_description || "",
          responsibilities: Array.isArray(job.responsibilities)
            ? job.responsibilities
            : [],
          qualifications: Array.isArray(job.qualifications)
            ? job.qualifications
            : [],
          additionalInformation: job.additional_information || {},
          hiringManager: job.hiring_manager || "N/A",
          recruiter: job.recruiter || "N/A",
          skills_required: (() => {
            try {
              return Array.isArray(job.skills_required)
                ? job.skills_required
                : JSON.parse(job.skills_required || "[]");
            } catch {
              return [];
            }
          })(),
        }));

        console.log("[DEBUG] Formatted jobs:", formattedJobs);
        setAllJobs(formattedJobs);
      } catch (error) {
        console.error("Error loading job data:", error);
      }
    };

    fetchJobs();
  }, []);

  const locations = useMemo(
    () => [...new Set(allJobs.map((job) => job.location))],
    [allJobs]
  );

  const experiences = useMemo(
    () => [...new Set(allJobs.map((job) => job.experience_required))],
    [allJobs]
  );

  const filteredJobs = useMemo(() => {
    const filtered = allJobs.filter((job) => {
      const matchesTitle = job.title?.toLowerCase().includes(searchText.toLowerCase());
      const matchesReferral = referralOnly ? job.referral : true;
      const matchesLocation = location === "All" || job.location === location;
      const matchesExperience = experience === "All" || job.experience_required === experience;

      return matchesTitle && matchesReferral && matchesLocation && matchesExperience;
    });

    console.log("[DEBUG] Filter logic:", {
      searchText,
      referralOnly,
      location,
      experience,
      resultCount: filtered.length,
    });

    return filtered;
  }, [allJobs, searchText, referralOnly, location, experience]);

  const visibleJobs = filteredByRef !== null ? filteredByRef : filteredJobs;

  console.log("[DEBUG] visibleJobs:", visibleJobs);

  const handleRefSearch = () => {
    const match = allJobs.find(
      (job) =>
        job.ref &&
        job.ref.toLowerCase() === refCodeInput.trim().toLowerCase()
    );
    console.log("[DEBUG] REF search input:", refCodeInput, "→ match:", match);
    setFilteredByRef(match ? [match] : []);
    setShowRefModal(false);
  };

  const handleFilterClearSearch = () => {
    setSearchText("");
    setReferralOnly(false);
    setLocation("All");
    setExperience("All");
    setFilteredByRef(null);
  };

  return (
    <>
      <TopHeader />

      <div className="search-toolbar">
        <div className="search-left">
          <input
            className="search-input"
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setFilteredByRef(null);
            }}
          />
          <button className="ref-code-link" onClick={() => setShowRefModal(true)}>
            Use a REF code
          </button>
          <div className="internal-switch-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <span className="switch-label">Internal jobs only</span>
          </div>
          <p className="job-count">
            Showing {visibleJobs.length} of {allJobs.length} jobs
          </p>
        </div>

        <div className="search-right">
          <div className="alert-section">
            <img src={NotificationIcon} alt="Job alert" className="bell-icon" />
            <span className="alert-label">Job alert</span>
            <span className="divider">|</span>
            <a href="#referral" className="referral-link">
              How to make a referral <span className="help-icon">?</span>
            </a>
          </div>
          <div className="sort-select">
            <span className="sort-label">Sort:</span>
            <select defaultValue="Posted Date">
              <option value="Posted Date">Posted Date</option>
              <option value="Title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {showRefModal && (
        <div className="ref-modal-overlay">
          <div className="ref-modal">
            <h3>Use a REF code</h3>
            <p className="ref-description">
              REF codes are provided by your internal hiring team.
            </p>
            <input
              type="text"
              className="ref-input"
              placeholder="For example: REF84O"
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value)}
            />
            <div className="ref-buttons">
              <button onClick={() => setShowRefModal(false)}>Cancel</button>
              <button className="search-btn" onClick={handleRefSearch}>
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="recruitment-layout">
        <div className="filter-sidebar">
          <h3 className="filter-title">
            <img src={FilterIcon} alt="Filter" className="filter-title-icon" />
            Filters
          </h3>

          <div className="filter-group">
            <label>Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="All">All</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="All">All</option>
              {experiences.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Other filters</label>
            <div className="checkbox-label">
              <input
                type="checkbox"
                id="referral"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <label htmlFor="referral">Referral only</label>
            </div>
          </div>

          <div className="filter-group">
            <button className="clear-filter-btn" onClick={handleFilterClearSearch}>
              <img src={FilterIcon} alt="Clear Filters" className="filter-icon" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="job-list">
          <h2 className="page-title">Available Job Listings</h2>
          {visibleJobs.length === 0 ? (
            <p className="no-result">No job found for this REF code.</p>
          ) : (
            visibleJobs.map((job, idx) => (
              <JobCard key={idx} job={job} logo={EndavaLogo} onClick={setSelectedJob} />
            ))
          )}
        </div>
      </div>

      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

export default Candidate;
