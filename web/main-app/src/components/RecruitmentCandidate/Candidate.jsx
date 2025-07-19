import { useEffect, useState, useMemo } from "react";
import "../../css/RecruitmentCandidate.css";
import SmartRecruitmentLogo from "../../assets/images/smart-recruitment-admin-logo.png";
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
  const [location, setLocation] = useState("Tất cả");
  const [level, setLevel] = useState("Tất cả");
  const [showRefModal, setShowRefModal] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState("");
  const [filteredByRef, setFilteredByRef] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getAllJD();
        const formattedJobs = jobs.map((job) => ({
          id: job.id,
          title: job.position || "Không có tiêu đề",
          location: job.location || "Chưa xác định",
          date: job.datetime
            ? new Date(job.datetime).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
            : "N/A",
          datetime: job.datetime || null,
          referral: job.referral || false,
          ref: typeof job.referral_code === "string" ? job.referral_code : null,
          experience_required: String(job.experience_required || ""),
          level: job.level || "Không rõ",
          companyDescription: job.company_description || "",
          jobDescription: job.job_description || "",
          responsibilities: Array.isArray(job.responsibilities)
            ? job.responsibilities
            : [],
          qualifications: Array.isArray(job.qualifications)
            ? job.qualifications
            : [],
          additionalInformation: job.additional_information || {},
          hiringManager: job.hiring_manager || "Không rõ",
          recruiter: job.recruiter || "Không rõ",
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

        setAllJobs(formattedJobs);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tuyển sinh:", error);
      }
    };

    fetchJobs();
  }, []);

  const locations = useMemo(
    () => [...new Set(allJobs.map((job) => job.location))],
    [allJobs]
  );

  const levels = useMemo(
    () => [...new Set(allJobs.map((job) => job.level))],
    [allJobs]
  );

  const filteredJobs = useMemo(() => {
    const filtered = allJobs.filter((job) => {
      const matchesTitle = job.title?.toLowerCase().includes(searchText.toLowerCase());
      const matchesReferral = referralOnly ? job.referral : true;
      const matchesLocation = location === "Tất cả" || job.location === location;
      const matchesLevel = level === "Tất cả" || job.level === level;

      return matchesTitle && matchesReferral && matchesLocation && matchesLevel;
    });

    return filtered;
  }, [allJobs, searchText, referralOnly, location, level]);

  const visibleJobs = filteredByRef !== null ? filteredByRef : filteredJobs;

  const handleRefSearch = () => {
    const match = allJobs.find(
      (job) =>
        job.ref &&
        job.ref.toLowerCase() === refCodeInput.trim().toLowerCase()
    );
    setFilteredByRef(match ? [match] : []);
    setShowRefModal(false);
  };

  const handleFilterClearSearch = () => {
    setSearchText("");
    setReferralOnly(false);
    setLocation("Tất cả");
    setLevel("Tất cả");
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
            placeholder="Tìm kiếm theo vị trí"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setFilteredByRef(null);
            }}
          />
          <button className="ref-code-link" onClick={() => setShowRefModal(true)}>
            Sử dụng mã giới thiệu
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
            <span className="switch-label">Chỉ hiển thị tuyển nội bộ</span>
          </div>
          <p className="job-count">
            Hiển thị {visibleJobs.length} trong tổng số {allJobs.length} đợt tuyển sinh
          </p>
        </div>

        <div className="search-right">
          <div className="alert-section">
            <img src={NotificationIcon} alt="Thông báo" className="bell-icon" />
            <span className="alert-label">Thông báo tuyển sinh</span>
            <span className="divider">|</span>
            <a href="#referral" className="referral-link">
              Cách giới thiệu ứng viên <span className="help-icon">?</span>
            </a>
          </div>
          <div className="sort-select">
            <span className="sort-label">Sắp xếp:</span>
            <select defaultValue="Posted Date">
              <option value="Posted Date">Ngày đăng</option>
              <option value="Title">Tên vị trí</option>
            </select>
          </div>
        </div>
      </div>

      {showRefModal && (
        <div className="ref-modal-overlay">
          <div className="ref-modal">
            <h3>Nhập mã giới thiệu</h3>
            <p className="ref-description">
              Mã REF do đội ngũ tuyển sinh nội bộ cung cấp cho bạn.
            </p>
            <input
              type="text"
              className="ref-input"
              placeholder="Ví dụ: REF84O"
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value)}
            />
            <div className="ref-buttons">
              <button onClick={() => setShowRefModal(false)}>Hủy</button>
              <button className="search-btn" onClick={handleRefSearch}>
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="recruitment-layout">
        <div className="filter-sidebar">
          <h3 className="filter-title">
            <img src={FilterIcon} alt="Bộ lọc" className="filter-title-icon" />
            Bộ lọc tìm kiếm
          </h3>

          <div className="filter-group">
            <label>Địa điểm</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="Tất cả">Tất cả</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Trình độ yêu cầu</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="Tất cả">Tất cả</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Lọc khác</label>
            <div className="checkbox-label">
              <input
                type="checkbox"
                id="referral"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <label htmlFor="referral">Chỉ hiển thị có mã giới thiệu</label>
            </div>
          </div>

          <div className="filter-group">
            <button className="clear-filter-btn" onClick={handleFilterClearSearch}>
              <img src={FilterIcon} alt="Xóa bộ lọc" className="filter-icon" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="job-list">
          <h2 className="page-title">Danh sách đợt tuyển sinh</h2>
          {visibleJobs.length === 0 ? (
            <p className="no-result">Không tìm thấy kết quả phù hợp.</p>
          ) : (
            visibleJobs.map((job, idx) => (
              <JobCard key={idx} job={job} logo={SmartRecruitmentLogo} onClick={setSelectedJob} />
            ))
          )}
        </div>
      </div>

      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

export default Candidate;
