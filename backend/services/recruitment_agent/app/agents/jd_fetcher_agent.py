from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from models.job_description import JobDescription
from config.log_config import AppLogger

logger = AppLogger(__name__)

class JDFetcherAgent(BaseAgent):
    def __init__(self, db_session):
        self.db = db_session

    def run(self, state: RecruitmentState) -> RecruitmentState:
        # Require a specific JD via jd_id
        if not state.jd_id:
            raise ValueError("jd_id must be provided!")
        jd = self.db.query(JobDescription).filter_by(id=state.jd_id).first()
        if not jd:
            logger.warn(f"[JDFetcherAgent] Provided jd_id={state.jd_id} not found.")
            state.jd_list = []
            return state
        jd_records = [jd]

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
            f"[JDFetcherAgent] Using provided jd_id={state.jd_id}; selected 1 JD"
        )

        state.jd_list = jd_list
        return state