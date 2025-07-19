from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from utils.email_sender import EmailSender
from config.constants import *
from config.log_config import AppLogger

logger = AppLogger(__name__)


class FinalDecisionAgent(BaseAgent):
    def __init__(self, email_sender: EmailSender, db_session):
        self.email_sender = email_sender
        self.db = db_session

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            logger.info("[FinalDecisionAgent] Pipeline stopped. Skipping final decision.")
            return state

        if not state.parsed_cv:
            logger.warn("[FinalDecisionAgent] No parsed CV data.")
            return state

        if state.matched_jd is None:
            logger.info("[FinalDecisionAgent] No JD matched. CV is rejected.")
            state.final_decision = (
                f"{FinalDecisionStatus.REJECTED.value}: No matching JD found."
            )
            return state

        if state.approved_candidate:
            candidate_name = state.approved_candidate.get("name", "Thí sinh")
            logger.info(f"[FinalDecisionAgent] Candidate approved: {candidate_name}")

            recipient_email = (
                getattr(state, "override_email", None)
                or state.parsed_cv.get("email")
                or DEFAULT_CANDIDATE_EMAIL
            )

            subject = f"Thông báo trúng tuyển vào {state.matched_jd.get("position")}"

            # Use summary if available
            summary_block = (
                f"\n\nTóm tắt hồ sơ học sinh:\n{state.cv_summary.strip()}"
                if state.cv_summary else ""
            )

            logger.debug(f"[FinalDecisionAgent] CV Summary: {state.cv_summary}")
            logger.debug(f"[FinalDecisionAgent] Sending email to {recipient_email}")

            body = f"""
Kính gửi {candidate_name},

Chúng tôi xin trân trọng thông báo rằng bạn đã chính thức được tuyển vào chương trình {state.matched_jd.get("position")}.

{summary_block}

Chúng tôi đánh giá cao năng lực học tập, tinh thần cầu tiến và những thành tích nổi bật mà bạn đã thể hiện trong hồ sơ đăng ký.
Chúc mừng bạn đã trở thành một thành viên mới của cộng đồng học sinh năng động và xuất sắc của nhà trường.

Thông tin nhập học và hướng dẫn tiếp theo sẽ được gửi trong thời gian sớm nhất.

Trân trọng,  
Ban Tuyển sinh  

""".strip()

            if recipient_email:
                self.email_sender.send_email(recipient_email, subject, body)
                logger.info(f"[FinalDecisionAgent] Offer email sent to {recipient_email}")
                state.final_decision = (
                    f"{FinalDecisionStatus.ACCEPTED.value}: Offer email sent."
                )
            else:
                logger.warn("[FinalDecisionAgent] No valid email found.")
                state.final_decision = (
                    f"{FinalDecisionStatus.ACCEPTED.value} but no email sent."
                )
        else:
            logger.info("[FinalDecisionAgent] Candidate not approved after confirmation.")
            state.final_decision = (
                f"{FinalDecisionStatus.REJECTED.value}: Candidate not approved."
            )

        return state
