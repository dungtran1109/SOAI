from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from config.log_config import AppLogger
from config.constants import *

logger = AppLogger(__name__)


class ApproverAgent(BaseAgent):
    def __init__(self, llm):
        self.llm = llm

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            return state

        if not state.matched_jd:
            logger.warn("[ApproverAgent] No matched JD, skipping developer approval.")
            state.approved_candidate = None
            return state

        logger.debug(f"[ApproverAgent] state.parsed_cv: {state.parsed_cv}")
        logger.debug(f"[ApproverAgent] state.matched_jd: {state.matched_jd}")

        candidate_skills = set(
            skill.lower() for skill in state.parsed_cv.get("skills", [])
        )
        jd_skills = set(
            skill.lower() for skill in state.matched_jd.get("skills_required", [])
        )

        logger.debug(f"[ApproverAgent] candidate_skills: {candidate_skills}")
        logger.debug(f"[ApproverAgent] jd_skills: {jd_skills}")

        candidate_experience = state.parsed_cv.get("experience_years", 0)
        try:
            jd_experience = int(state.matched_jd.get("experience_required", 0))
        except (TypeError, ValueError):
            jd_experience = 0

        if not candidate_skills or not jd_skills:
            logger.warn("[ApproverAgent] Missing skills for matching.")
            state.approved_candidate = None
            return state

        # Flexible skill matching: partial match allowed
        matching_skills = []
        for jd_skill in jd_skills:
            for cv_skill in candidate_skills:
                if jd_skill in cv_skill or cv_skill in jd_skill:
                    matching_skills.append(jd_skill)
                    break

        if jd_skills:
            skill_match_percentage = (len(matching_skills) / len(jd_skills)) * 100
        else:
            skill_match_percentage = 0.0

        experience_match = (
            candidate_experience >= jd_experience
            or (jd_experience - candidate_experience) <= 1
        )

        logger.info(f"[ApproverAgent] Matching skills: {matching_skills}")
        logger.info(f"[ApproverAgent] Skill match: {skill_match_percentage:.2f}%")
        logger.info(
            f"[ApproverAgent] Experience: CV {candidate_experience} yrs vs JD {jd_experience} yrs"
        )

        if skill_match_percentage >= MATCHING_SCORE_PERCENTAGE and experience_match:
            logger.info(
                "[ApproverAgent] Candidate approved (skills and experience matched)."
            )
            state.approved_candidate = state.parsed_cv
        else:
            logger.info(
                "[ApproverAgent] Candidate rejected (skills or experience mismatch)."
            )
            state.approved_candidate = None

        return state
