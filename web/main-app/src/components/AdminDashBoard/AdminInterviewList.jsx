import React, { useEffect, useState } from "react";
import {
  getInterviews,
  scheduleInterview,
  deleteInterview,
  updateInterview,
  acceptInterview,
  cancelInterview,
  getInterviewQuestions,
  regenerateInterviewQuestions,
} from "../../api/interviewApi";
import { getPendingCVs } from "../../api/cvApi";
import "../../css/AdminInterviewList.css";

import {
  FaCalendarAlt,
  FaRegEdit,
  FaTrashAlt,
  FaCheck,
  FaTimes,
  FaPlus,
  FaQuestionCircle,
  FaGraduationCap,
  FaTimesCircle,
  FaCommentDots,
  FaRedoAlt,
  FaSpinner
} from "react-icons/fa";
import { Dialog } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminInterviewList = ({ actionsEnabled = true }) => {
  const [interviews, setInterviews] = useState([]);
  const [approvedCVs, setApprovedCVs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [formData, setFormData] = useState({
    interviewer_name: "",
    interview_datetime: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);
  const [questionModal, setQuestionModal] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRegenerationCvId, setPendingRegenerationCvId] = useState(null);

  useEffect(() => {
    fetchInterviews();
    if (actionsEnabled) fetchApprovedCVs();
  }, [actionsEnabled]);

  const fetchInterviews = async () => {
    try {
      const result = await getInterviews();
      setInterviews(result || []);
    } catch (error) {
      toast.error("Failed to fetch interviews");
    }
  };

  const fetchApprovedCVs = async () => {
    try {
      const result = await getPendingCVs();
      setApprovedCVs(result || []);
    } catch (error) {
      toast.error("Failed to fetch approved CVs");
    }
  };

  const handleRegenerateConfirm = (cvId) => {
    setPendingRegenerationCvId(cvId);
    setConfirmDialogOpen(true);
  };

  const openModal = (cv) => {
    setEditMode(false);
    setSelectedCV(cv);
    setFormData({ interviewer_name: "", interview_datetime: "" });
    setShowModal(true);
  };

  const openEditModal = (interview) => {
    setEditMode(true);
    setEditingInterviewId(interview.id);
    setSelectedCV({ candidate_name: interview.candidate_name });
    setFormData({
      interviewer_name: interview.interviewer_name,
      interview_datetime: interview.interview_datetime.slice(0, 16),
    });
    setShowModal(true);
  };

  const handleScheduleOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.interviewer_name || !formData.interview_datetime) return;
    try {
      if (editMode) {
        await updateInterview(editingInterviewId, formData);
        toast.success("Interview updated successfully.");
      } else {
        await scheduleInterview({
          candidate_name: selectedCV.candidate_name,
          ...formData,
        });
        toast.success("Interview scheduled successfully.");
      }
      setShowModal(false);
      fetchInterviews();
    } catch (err) {
      toast.error("Failed to save interview");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this interview?")) return;
    try {
      await deleteInterview(id);
      toast.success("Interview deleted.");
      fetchInterviews();
    } catch (err) {
      toast.error("Failed to delete interview.");
    }
  };

  const handleAccept = async (interview) => {
    try {
      const res = await acceptInterview({
        candidate_name: interview.candidate_name,
        interview_datetime: interview.interview_datetime,
        candidate_id: interview.id,
      });
      toast.success(res.message || "Interview accepted.");
      fetchInterviews();
    } catch (err) {
      toast.error("Failed to accept interview.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelInterview(id);
      toast.success("Interview cancelled.");
      fetchInterviews();
    } catch (err) {
      toast.error("Failed to cancel interview.");
    }
  };

  const openQuestionsModal = async (cvId) => {
    try {
      const questions = await getInterviewQuestions(cvId);
      const parsed = questions.map((q) => {
        let parsedContent;
        try {
          const tryParse = JSON.parse(q.original_question);
          if (typeof tryParse === 'object' && tryParse.question && tryParse.answers) {
            parsedContent = tryParse;
          } else {
            throw new Error('Not valid format');
          }
        } catch {
          parsedContent = {
            question: q.original_question,
            answers: q.answer ? [q.answer] : []
          };
        }
        return parsedContent;
      });
      setInterviewQuestions(parsed);
      setQuestionModal(true);
    } catch (err) {
      toast.error("Failed to load interview questions.");
    }
  };

  const confirmRegeneration = async () => {
    const cvId = pendingRegenerationCvId;
    setConfirmDialogOpen(false);
    try {
      setRegeneratingId(cvId);
      const updated = await regenerateInterviewQuestions(cvId);
      toast.success("Questions regenerated successfully.");
      const parsed = updated.map((q) => {
        let parsedContent;
        try {
          const tryParse = JSON.parse(q.original_question);
          if (typeof tryParse === 'object' && tryParse.question && tryParse.answers) {
            parsedContent = tryParse;
          } else {
            throw new Error('Not valid format');
          }
        } catch {
          parsedContent = {
            question: q.original_question,
            answers: q.answer ? [q.answer] : []
          };
        }
        return parsedContent;
      });
      setInterviewQuestions(parsed);
      setQuestionModal(true);
    } catch (err) {
      toast.error("Failed to regenerate questions.");
    } finally {
      setRegeneratingId(null);
      setPendingRegenerationCvId(null);
    }
  };

  return (
    <div className="admin-interview-list">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="admin-interview-list__header">
        <FaCalendarAlt style={{ marginRight: "8px" }} /> Lịch phỏng vấn sắp tới
      </div>

      <ul className="admin-interview-list__items">
        {interviews.map((interview) => (
          <li key={interview.id} className="admin-interview-list__item">
            <div>
              <p className="admin-interview-list__candidate">{interview.candidate_name}</p>
              <p className="admin-interview-list__date">
                {new Date(interview.interview_datetime).toLocaleString()}
              </p>
              <p className="admin-interview-list__interviewer">
                Người phỏng vấn: {interview.interviewer_name}
              </p>
              <p className="admin-interview-list__status">
                Trạng thái: {interview.status || "Scheduled"}
              </p>
            </div>
            <div className="admin-interview-list__actions">
              {actionsEnabled ? (
                <>
                  <button title="Edit" onClick={() => openEditModal(interview)}><FaRegEdit /></button>
                  <button title="Delete" onClick={() => handleDelete(interview.id)}><FaTrashAlt /></button>
                  <button title="View Questions" onClick={() => openQuestionsModal(interview.cv_application_id)}><FaQuestionCircle /></button>
                  <button
                    title="Regenerate Questions"
                    onClick={() => handleRegenerateConfirm(interview.cv_application_id)}
                    disabled={regeneratingId === interview.cv_application_id}
                  >
                    {regeneratingId === interview.cv_application_id ? <FaSpinner className="spin" /> : <FaRedoAlt />}
                  </button>

                  <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} className="confirm-dialog">
                    <div className="confirm-dialog__backdrop" aria-hidden="true" />
                    <div className="confirm-dialog__panel">
                      <Dialog.Title className="confirm-dialog__title">Xác nhận tái tạo</Dialog.Title>
                      <Dialog.Description className="confirm-dialog__desc">
                        Bạn có chắc chắn muốn tái tạo và ghi đè các câu hỏi phỏng vấn hiện có không?
                      </Dialog.Description>
                      <div className="confirm-dialog__actions">
                        <button onClick={() => setConfirmDialogOpen(false)} className="confirm-dialog__cancel">Hủy</button>
                        <button
                          onClick={confirmRegeneration}
                          className="confirm-dialog__confirm"
                          disabled={regeneratingId === pendingRegenerationCvId}
                        >
                          {regeneratingId === pendingRegenerationCvId ? <FaSpinner className="spin" /> : "Có, Tái tạo"}
                        </button>
                      </div>
                    </div>
                  </Dialog>
                </>
              ) : (
                interview.status === "Accepted" ? null : (
                  <>
                    <button title="Accept" onClick={() => handleAccept(interview)}><FaCheck /></button>
                    <button title="Cancel" onClick={() => handleCancel(interview.id)}><FaTimes /></button>
                  </>
                )
              )}
            </div>
          </li>
        ))}
      </ul>

      {actionsEnabled && (
        <>
          <div className="admin-interview-list__header">
            <FaPlus style={{ marginRight: "8px", marginTop: "32px" }} /> Đặt lịch phỏng vấn
          </div>
          <ul className="admin-interview-list__items">
            {approvedCVs.map((cv) => (
              <li key={cv.id} className="admin-interview-list__item">
                <div>
                  <p className="admin-interview-list__candidate">{cv.candidate_name}</p>
                  <p className="admin-interview-list__position">{cv.matched_position}</p>
                </div>
                <button className="admin-interview-list__schedule-btn" onClick={() => openModal(cv)}>
                  <FaPlus /> Lên lịch phỏng vấn
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {showModal && selectedCV && (
        <div className="admin-interview-list__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-interview-list__modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-interview-list__close" onClick={() => setShowModal(false)}>
              <FaTimesCircle />
            </button>
            <h3>{editMode ? "Edit Interview" : `Schedule Interview for ${selectedCV.candidate_name}`}</h3>
            <form onSubmit={handleScheduleOrUpdate} className="admin-interview-list__form">
              <label>Người phỏng vấn</label>
              <input type="text" value={formData.interviewer_name} onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })} required />
              <label>Ngày & Giờ phỏng vấn</label>
              <input type="datetime-local" value={formData.interview_datetime} onChange={(e) => setFormData({ ...formData, interview_datetime: e.target.value })} required />
              <button type="submit" className="admin-interview-list__submit-btn">
                {editMode ? <><FaRegEdit /> Cập nhật</> : <><FaPlus /> Đặt lịch</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {questionModal && (
        <div className="admin-interview-list__modal-overlay" onClick={() => setQuestionModal(false)}>
            <div className="admin-interview-list__modal admin-interview-list__question-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-interview-list__close" onClick={() => setQuestionModal(false)}>
                <FaTimesCircle />
            </button>
            <h3 className="admin-interview-list__question-title">
                <FaGraduationCap style={{ marginRight: "6px" }} /> Câu hỏi phỏng vấn đã được tạo
            </h3>
            <div className="admin-interview-list__question-list">
                {interviewQuestions.length > 0 ? (
                interviewQuestions.map((q, index) => (
                    <div key={index} className="admin-question-block">
                    <p className="admin-question">
                        <FaQuestionCircle />
                        <span>Câu hỏi {index + 1}: {q.question || q.original_question}</span>
                    </p>
                    {(q.answers || (q.answer ? [q.answer] : [])).map((ans, i) => (
                        <p key={i} className="admin-answer">
                        <FaCommentDots /> {ans}
                        </p>
                    ))}
                    </div>
                ))
                ) : (
                <p>Không có câu hỏi nào có sẵn.</p>
                )}
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default AdminInterviewList;