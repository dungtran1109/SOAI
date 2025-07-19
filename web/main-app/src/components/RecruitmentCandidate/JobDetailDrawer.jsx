import { useRef, useState } from "react";
import "../../css/JobDetailDrawer.css";
import SmartRecruitmentLogo from "../../assets/images/smart-recruitment-admin-logo.png";
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
      : d.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
  };

  const renderAdditionalInformation = (info) => {
    if (!info || typeof info !== "object" || Array.isArray(info)) return null;

    return (
      <section>
        <h4>Thông tin bổ sung</h4>
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

  const handleApplyClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file.name);
    setIsUploading(true);
    try {
      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_SIZE) {
        throw new Error("Kích thước tệp vượt quá giới hạn 5MB.");
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        throw new Error("Định dạng không hợp lệ. Chỉ chấp nhận PDF hoặc Word.");
      }
      const response = await uploadCV(file, job.position || job.title || "Không rõ vị trí");
      toast.success(response?.message || `Tải CV thành công!`);
    } catch (err) {
      toast.error(err?.message || "Tải CV thất bại.");
    }
    setIsUploading(false);
    e.target.value = "";
  };

  return (
    <div className="drawer-overlay" onClick={handleOutsideClick}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <img src={SmartRecruitmentLogo} alt="SmartRecruitment" className="drawer-logo" />
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-top">
          <h2 className="drawer-title">
            {job.position || job.title || "Không rõ vị trí"}
          </h2>
          <p className="drawer-sub">
            Yêu cầu trình độ: {job.level || "Không rõ"} • <span className="job-ref">{job.referral_code || job.ref || "Không có mã"}</span>
          </p>
        </div>

        <div className="drawer-body">
          {!!job.companyDescription?.trim() && (
            <section>
              <h4>Giới thiệu tổ chức</h4>
              <p>{job.companyDescription}</p>
            </section>
          )}

          {!!job.jobDescription?.trim() && (
            <section>
              <h4>Mô tả chi tiết</h4>
              <p>{job.jobDescription}</p>
            </section>
          )}

          {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
            <section>
              <h4>Nhiệm vụ</h4>
              <ul>
                {job.responsibilities.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.qualifications) && job.qualifications.length > 0 && (
            <section>
              <h4>Tiêu chí xét tuyển</h4>
              <ul>
                {job.qualifications.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.skills_required) && job.skills_required.length > 0 && (
            <section>
              <h4>Kỹ năng yêu cầu</h4>
              <ul>
                {job.skills_required.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {renderAdditionalInformation(job.additionalInformation)}

          <section className="job-meta-section">
            <div className="meta-row">
              <div>
                <strong>Địa điểm</strong><br />
                {job.location || "Chưa cập nhật"}
              </div>
              <div>
                <strong>Người phụ trách</strong><br />
                {job.hiringManager || "Không rõ"}
              </div>
            </div>
            <div className="meta-row">
              <div>
                <strong>Người liên hệ</strong><br />
                {job.recruiter || "Không rõ"}
              </div>
              <div>
                <strong>Ngày đăng</strong><br />
                {formatDate(job.datetime)}
              </div>
            </div>
          </section>
        </div>

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
            aria-label="Nộp hồ sơ"
          >
            {isUploading ? (
              <span className="spinner" aria-label="Đang tải lên"></span>
            ) : (
              "Nộp hồ sơ"
            )}
          </button>
          <button className="btn-outline" aria-label="Giới thiệu bạn bè">Giới thiệu bạn bè</button>
          <div className="referral-note">🔗 Liên kết giới thiệu</div>
          {selectedFile && (
            <div className="selected-file" style={{ marginTop: 8, fontSize: 13 }}>
              Tệp đã chọn: <strong>{selectedFile}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailDrawer;
