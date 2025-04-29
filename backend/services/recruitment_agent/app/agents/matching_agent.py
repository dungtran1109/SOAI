import json
from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from config.logging import AppLogger
from config.constants import *

logger = AppLogger(__name__)

class MatchingAgent(BaseAgent):
    def __init__(self, llm):
        self.llm = llm

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            return state

        if not state.jd_list:
            logger.warn("[MatchingAgent] No Job Descriptions (JDs) available for matching.")
            state.matched_jd = None
            state.stop_pipeline = True
            state.final_decision = "CV rejected: No available JDs."
            return state

        if not state.parsed_cv:
            logger.warn("[MatchingAgent] No parsed CV data available.")
            state.matched_jd = None
            state.stop_pipeline = True
            state.final_decision = "CV rejected: Invalid CV content."
            return state

        parsed_cv = state.parsed_cv
        cv_skills = parsed_cv.get("skills", [])

        best_match = None
        best_score = 0.0
        best_jd_skills = []

        for jd in state.jd_list:
            jd_skills_list = jd.get("skills_required", [])
            if isinstance(jd_skills_list, str):
                try:
                    jd_skills_list = json.loads(jd_skills_list)
                except Exception as e:
                    logger.error(f"[MatchingAgent] Error decoding JD skills JSON: {e}")
                    continue

            # Call LLM to evaluate match
            prompt = self.build_prompt(cv_skills, jd_skills_list)
            score = self.query_llm_score(prompt)

            logger.debug(f"[MatchingAgent] Checking JD: {jd.get('position', '')} - LLM Score: {score:.2f}%")

            if score > best_score:
                best_score = score
                best_match = jd
                best_jd_skills = jd_skills_list

        logger.debug(f"[Matching Agent] best_match: {best_match}")
        logger.debug(f"[Matching Agent] best_jd_skills: {best_jd_skills}")
        if best_match and best_score >= MATCHING_SCORE_PERCENTAGE:
            logger.info(f"[MatchingAgent] Best match found: {best_match['position']} (Score: {best_score:.2f}%)")
            state.matched_jd = {
                "position": best_match.get("position"),
                "skills_required": best_jd_skills,
                "experience_required": int(best_match.get("experience_required", 0)),
                "level": best_match.get("level"),
            }
            logger.debug(f"[Matching Agent] state.matched_jd: {state.matched_jd}")
        else:
            logger.error(f"[MatchingAgent] No JD matched above {MATCHING_SCORE_PERCENTAGE}%. Best score: {best_score:.2f}%")
            state.matched_jd = None
            state.stop_pipeline = True
            state.final_decision = "CV rejected: No matching JD found."

        return state

    def build_prompt(self, cv_skills, jd_skills):
        return (
            f"The candidate has the following skills: {', '.join(cv_skills)}.\n"
            f"The job requires the following skills: {', '.join(jd_skills)}.\n\n"
            f"Please rate the candidate's skill match for this job on a scale from 0 to 100.\n"
            f"Return only a number (e.g., 85). No explanation."
        )

    def query_llm_score(self, prompt: str) -> float:
        try:
            response = self.llm.invoke(prompt)
            content = response.content.strip()

            if content.startswith("```") and content.endswith("```"):
                content = content.strip("```").strip()

            return min(max(float(content), 0.0), 100.0)  # clamp between 0 and 100
        except Exception as e:
            logger.error(f"[MatchingAgent] LLM call failed or returned invalid score: {e}")
            return 0.0