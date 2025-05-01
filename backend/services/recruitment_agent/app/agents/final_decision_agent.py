from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from utils.email_sender import EmailSender
from config.constants import *
from config.logging import AppLogger

logger = AppLogger(__name__)

class FinalDecisionAgent(BaseAgent):
    def __init__(self, email_sender: EmailSender, db_session):
        self.email_sender = email_sender
        self.db = db_session

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            return state

        if not state.parsed_cv:
            logger.warning("[FinalDecisionAgent] No parsed CV data.")
            return state

        if state.matched_jd is None:
            logger.info("[FinalDecisionAgent] No JD matched. CV is rejected.")
            state.final_decision = f"{FinalDecisionStatus.REJECTED.value}: No matching JD found."
            return state

        if state.approved_candidate:
            logger.info(f"[FinalDecisionAgent] Candidate approved: {state.approved_candidate.get('name')}")
            recipient_email = (
                getattr(state, "override_email", None)
                or state.parsed_cv.get("email")
                or DEFAULT_CANDIDATE_EMAIL
            )

            subject = "Congratulations! You are hired"
            body = f"""
Dear {state.approved_candidate.get('name')},

Congratulations! We are pleased to offer you the position of {state.matched_jd.get('position')} at our company.

Please reply to confirm acceptance.

Best regards,
Talent Acquisition Team
"""

            if recipient_email:
                self.email_sender.send_email(recipient_email, subject, body)
                logger.info(f"[FinalDecisionAgent] Offer email sent to {recipient_email}")
                state.final_decision = f"{FinalDecisionStatus.ACCEPTED.value}: Offer email sent."
            else:
                logger.warning("[FinalDecisionAgent] No valid email found.")
                state.final_decision = f"{FinalDecisionStatus.ACCEPTED.value} but no email sent."
        else:
            logger.info("[FinalDecisionAgent] Candidate not approved after confirmation.")
            state.final_decision = f"{FinalDecisionStatus.REJECTED.value}: Candidate not approved."

        return state