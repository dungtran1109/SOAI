import json
from typing import Any, Dict, List, Tuple

from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from config.constants import MATCHING_SCORE_PERCENTAGE
from config.log_config import AppLogger
from utils.utils import *
logger = AppLogger(__name__)


def _build_scoring_prompt(cv_skills: List[str], jd_skills: List[str], education: List[Dict[str, Any]], languages: List[Dict[str, str]]) -> str:
    return f"""
You are an ATS scoring assistant.

Score the candidate vs the JD with this weighting:
- main_skills_score: 0–80, based ONLY on overlap and seniority fit between candidate skills and JD skills.
- extras_score: 0–20, based on education relevance/level and language proficiency (CEFR). Keep it conservative.
- total_score: main_skills_score + extras_score (must be 0–100).

Return ONLY ONE JSON object with exactly these keys:
{{
  "main_skills_score": 0.0,
  "extras_score": 0.0,
  "total_score": 0.0,
  "rationale": "short reason",
  "justification": "1–3 concise sentences for why this is or isn't a fit"
}}

Candidate skills: {", ".join(cv_skills)}
JD skills: {", ".join(jd_skills)}
Education: {json.dumps(education, ensure_ascii=False)}
Languages: {json.dumps(languages, ensure_ascii=False)}
""".strip()


def _parse_llm_scores(raw: Any) -> Tuple[float, float, float, str, str]:
    s = ensure_text(raw)
    s = unwrap_maybe_wrapper(s)
    s = clean_json_from_text(s)
    obj = json.loads(s)

    main = float(obj.get("main_skills_score", 0.0))
    extra = float(obj.get("extras_score", 0.0))
    total = float(obj.get("total_score", main + extra))
    rationale = ensure_text(obj.get("rationale", "")).strip()
    justification = ensure_text(obj.get("justification", "")).strip()

    if not (0.0 <= main <= 80.0 and 0.0 <= extra <= 20.0):
        raise ValueError("Scores out of expected bounds.")
    sum_ = main + extra
    if not (0.0 <= total <= 100.0 and abs(total - sum_) <= 1e-6 or abs(total - sum_) <= 0.5):
        # allow tiny rounding error up to 0.5
        total = max(0.0, min(100.0, sum_))

    return main, extra, total, rationale, justification


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

        if not state.parsed_cv or not isinstance(state.parsed_cv, dict):
            logger.warn("[MatchingAgent] No parsed CV data available.")
            state.matched_jd = None
            state.stop_pipeline = True
            state.final_decision = "CV rejected: Invalid CV content."
            return state

        parsed = state.parsed_cv
        cv_skills: List[str] = parsed.get("skills", []) or []
        education: List[Dict[str, Any]] = parsed.get("education", []) or []
        languages: List[Dict[str, str]] = parsed.get("languages", []) or []

        best_match = None
        best_score = -1.0
        best_jd_skills: List[str] = []
        best_scores_payload: Dict[str, Any] = {}

        for jd in state.jd_list:
            jd_skills_list = jd.get("skills_required", [])
            if isinstance(jd_skills_list, str):
                try:
                    jd_skills_list = json.loads(jd_skills_list)
                except Exception as e:
                    logger.error(f"[MatchingAgent] Failed to decode JD skills JSON: {e}")
                    continue
            if not isinstance(jd_skills_list, list):
                logger.error("[MatchingAgent] JD skills_required must be list or JSON-encoded list.")
                continue

            prompt = _build_scoring_prompt(cv_skills, jd_skills_list, education, languages)
            try:
                resp = self.llm.invoke(prompt)
                raw = getattr(resp, "content", None) or getattr(resp, "text", None) or getattr(resp, "data", None) or resp
                main, extra, total, rationale, justification = _parse_llm_scores(raw)
                logger.debug(f"[MatchingAgent] JD='{jd.get('position','')}' scores: main={main:.2f} extra={extra:.2f} total={total:.2f}")
            except Exception as e:
                logger.error(f"[MatchingAgent] LLM scoring failed for JD='{jd.get('position','')}': {e}")
                continue

            if total > best_score:
                best_score = total
                best_match = jd
                best_jd_skills = jd_skills_list
                best_scores_payload = {
                    "main_skills_score": main,
                    "extras_score": extra,
                    "total_score": total,
                    "rationale": rationale,
                    "justification": justification,
                }

        if best_match and best_score >= MATCHING_SCORE_PERCENTAGE:
            logger.info(f"[MatchingAgent] Best match: {best_match.get('position')} (Score: {best_score:.2f}%)")
            state.matched_jd = {
                "position": best_match.get("position"),
                "skills_required": best_jd_skills,
                "experience_required": int(best_match.get("experience_required", 0)),
                "level": best_match.get("level"),
                "score_breakdown": best_scores_payload,
            }
            return state

        logger.error(f"[MatchingAgent] No JD matched above {MATCHING_SCORE_PERCENTAGE}% (best={best_score:.2f}%).")
        state.matched_jd = None
        state.stop_pipeline = True
        state.final_decision = "CV rejected: No matching JD found."
        return state
