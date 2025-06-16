from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from models.job_description import JobDescription
from config.log_config import AppLogger

logger = AppLogger(__name__)

class JDFetcherAgent(BaseAgent):
    def __init__(self, db_session):
        self.db = db_session

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if not state.position_applied_for:
            raise ValueError("Position to apply for must be provided!")

        jd_records = self.db.query(JobDescription).filter_by(position=state.position_applied_for).all()

        if not jd_records:
            state.jd_list = []
            return state

        seen_signatures = set()
        jd_list = [
            {
                "position": jd.position,
                "skills_required": jd.skills_required,
                "experience_required": jd.experience_required,
                "level": jd.level,
            }
            for jd in jd_records
            if not (sig := (jd.position, jd.skills_required, jd.experience_required, jd.level)) in seen_signatures and not seen_signatures.add(sig)
        ]

        logger.info(f"[JDFetcherAgent] Found {len(jd_list)} JD(s) for position: {state.position_applied_for}")
        state.jd_list = jd_list
        return state