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

        # Fetch all JDs matching the position
        jd_records = (
            self.db.query(JobDescription)
            .filter_by(position=state.position_applied_for)
            .all()
        )

        if not jd_records:
            state.jd_list = []
            return state

        # Deduplicate by signature
        seen_signatures = set()
        jd_list = []

        for jd in jd_records:
            # JSON list is unhashable. Convert to tuple for signature
            skills_signature = tuple(sorted(jd.skills_required)) if jd.skills_required else ()
            
            signature = (
                jd.position,
                skills_signature,
                jd.experience_required,
                jd.level,
            )

            if signature not in seen_signatures:
                seen_signatures.add(signature)

                jd_list.append({
                    "position": jd.position,
                    "skills_required": jd.skills_required,
                    "experience_required": jd.experience_required,
                    "level": jd.level,
                })

        logger.info(
            f"[JDFetcherAgent] Found {len(jd_list)} unique JD(s) for position: {state.position_applied_for}"
        )

        state.jd_list = jd_list
        return state