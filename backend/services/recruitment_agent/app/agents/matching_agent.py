import json
import re
from unidecode import unidecode
from typing import Optional
from agents.base_agent import BaseAgent
from agents.state import RecruitmentState
from config.log_config import AppLogger
from config.constants import *

logger = AppLogger(__name__)

SUBJECT_ALIASES = {
    "toanhoc": "toán", "toan": "toán",
    "vatly": "vật lý", "ly": "vật lý",
    "hoahoc": "hóa học", "hoa": "hóa học",
    "sinhhoc": "sinh học", "sinh": "sinh học",
    "van": "văn", "nguvan": "văn",
    "dialy": "địa lý", "dia": "địa lý",
    "lichsu": "lịch sử", "lich": "lịch sử",
    "tienganh": "tiếng anh", "anh": "tiếng anh",
    "gdcd": "giáo dục công dân", "giaoduccongdan": "giáo dục công dân",
    "tinhoc": "tin học", "cntt": "tin học",
    "theduc": "thể dục", "quocphong": "quốc phòng",
    "amnhac": "âm nhạc", "mythuat": "mỹ thuật"
}

def normalize_subject_key(key: str) -> str:
    key = unidecode(key).lower()
    key = re.sub(r"[\s\-_:]+", "", key)
    return SUBJECT_ALIASES.get(key, key)

def infer_priority_subject_from_jd(jd: dict) -> Optional[str]:
    jd_skills_raw = jd.get("skills_required", [])
    if isinstance(jd_skills_raw, str):
        try:
            jd_skills_raw = json.loads(jd_skills_raw)
        except Exception as e:
            logger.warning(f"[infer_priority_subject_from_jd] Lỗi parse kỹ năng JD: {e}")
            return None

    max_score = -1
    priority_subject = None
    for item in jd_skills_raw:
        if ":" in item:
            try:
                key, value = item.split(":", 1)
                norm_key = normalize_subject_key(key)
                score = float(value.strip())
                if score > max_score:
                    max_score = score
                    priority_subject = norm_key
            except:
                continue
    return priority_subject

class MatchingAgent(BaseAgent):
    def __init__(self, llm):
        self.llm = llm

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            return state

        if not state.jd_list:
            logger.warn("[MatchingAgent] Không có chuyên đề để xét tuyển.")
            state.matched_jd = None
            return state

        if not state.parsed_cv:
            logger.warn("[MatchingAgent] Không có nội dung hồ sơ học sinh.")
            state.matched_jd = None
            return state

        parsed_cv = state.parsed_cv
        cv_skills = parsed_cv.get("skills", [])

        def parse_scores(skills):
            scores = {}
            for item in skills:
                if ":" in item:
                    try:
                        key, value = item.split(":", 1)
                        norm_key = normalize_subject_key(key)
                        scores[norm_key] = float(value.strip())
                    except:
                        continue
            return scores

        cv_scores = parse_scores(cv_skills)

        best_match = None
        best_score = 0.0
        best_jd_skills = []

        for jd in state.jd_list:
            jd_skills_raw = jd.get("skills_required", [])
            if isinstance(jd_skills_raw, str):
                try:
                    jd_skills_raw = json.loads(jd_skills_raw)
                except Exception as e:
                    logger.error(f"[MatchingAgent] Lỗi khi parse skills_required: {e}")
                    continue

            jd_scores = parse_scores(jd_skills_raw)
            priority_subject = infer_priority_subject_from_jd(jd)

            total_pct = 0.0
            total_weight = 0.0
            all_pass = True

            for subject, required_score in jd_scores.items():
                norm_subject = normalize_subject_key(subject)
                actual = cv_scores.get(norm_subject, 0.0)

                if actual < required_score:
                    all_pass = False
                    logger.debug(f"[MatchingAgent] Môn '{norm_subject}' không đạt yêu cầu: {actual} < {required_score}")

                is_priority = priority_subject and norm_subject == priority_subject
                weight = 2.0 if is_priority else 1.0

                if is_priority:
                    logger.debug(f"[MatchingAgent] Ưu tiên môn '{norm_subject}': weight = {weight}")

                pct = 0.0 if actual < required_score else min((actual / required_score) * 100, 100)
                total_pct += pct * weight
                total_weight += weight

            if total_weight == 0:
                logger.info(f"[MatchingAgent] Không có môn nào đạt yêu cầu. Bỏ qua JD: {jd.get('position')}")
                continue

            avg_pct = total_pct / total_weight
            score_subjects = min(avg_pct * 0.7, 70)

            score_extras = 0.0
            if all_pass:
                prompt = self.build_extras_prompt(parsed_cv)
                extras_score = self.query_llm_score(prompt)
                score_extras = min(extras_score * 0.3, 30)
            else:
                logger.debug("[MatchingAgent] Bỏ điểm hoạt động vì không đạt đủ yêu cầu môn học.")

            total_score = round(score_subjects + score_extras, 2)
            logger.debug(f"[MatchingAgent] JD: {jd.get('position')} → total_score: {total_score:.2f}")

            if total_score > best_score:
                best_score = total_score
                best_match = jd
                best_jd_skills = jd_skills_raw

        state.matched_jd = {
            "position": best_match.get("position") if best_match else state.position_applied_for or "Unknown",
            "skills_required": best_jd_skills if best_match else [],
            "level": best_match.get("level") if best_match else "Unknown",
            "match_score": int(best_score)
        }

        if best_match:
            logger.info(f"[MatchingAgent] Best match: {best_match.get('position')} (match_score={best_score:.2f}%)")
        else:
            logger.info(f"[MatchingAgent] Không tìm thấy chuyên đề phù hợp. Fallback score: {best_score:.2f}")

        return state

    def build_extras_prompt(self, parsed_cv: dict) -> str:
        return f"""
You are evaluating a student's profile for high school admission. Based on the provided CV content, assess the candidate’s overall academic potential, including:

- Academic awards or competitions
- Personal projects or portfolio
- Logical or critical thinking ability
- Learning motivation and independence

Score the candidate on a scale from 0 to 100 based on these aspects only (not subject scores).

CV Content:
{json.dumps(parsed_cv, ensure_ascii=False, indent=2)}

Return only a single integer number, like: 85
""".strip()

    def build_llm_match_prompt(self, parsed_cv: dict, jd: dict) -> str:
        return f"""
You are an admissions evaluator. Based on the student's CV and the Job Description (exam requirements), evaluate how well the student meets the subject and skill criteria.

## Job Description
Position: {jd.get('position')}
Required Subjects and Scores: {jd.get('skills_required')}
Level: {jd.get('level')}

## Student CV
Name: {parsed_cv.get('name')}
Subjects and Scores: {parsed_cv.get('skills')}
Other Info: {parsed_cv.get('email')}

Evaluate:
- Do subject scores meet or exceed requirements?
- Are there related subjects that compensate?
- Are there strong academic or logical thinking traits?

Return a JSON object with:
- "match_score" (0-100, integer)
- "justification" (short explanation)
""".strip()

    def query_llm_score(self, prompt: str) -> float:
        try:
            response = self.llm.invoke(prompt)
            content = response.json()["data"]
            if content.startswith("```") and content.endswith("```"):
                content = content.strip("```").strip()
            return min(max(float(content), 0.0), 100.0)
        except Exception as e:
            logger.error(f"[MatchingAgent] LLM score failed: {e}")
            return 0.0