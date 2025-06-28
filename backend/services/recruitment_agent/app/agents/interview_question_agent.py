from agents.state import RecruitmentState
from config.log_config import AppLogger
import json
import re

logger = AppLogger(__name__)

class InterviewQuestionAgent:
    def __init__(self, llm):
        self.llm = llm  # The LLM service instance (e.g., GenAI, OpenAI wrapper)

    def _get_question_count_by_level(self, level: str) -> int:
        """Return number of questions based on candidate level using regex match."""
        level_map = [
            (r"intern", 3),
            (r"fresher", 4),
            (r"junior", 5),
            (r"mid", 6),
            (r"senior", 8),
            (r"lead", 10),
            (r"architect", 12),
        ]
        for pattern, count in level_map:
            if re.search(pattern, level, re.IGNORECASE):
                return count
        return 5  # default fallback

    def run(self, state: RecruitmentState) -> RecruitmentState:
        logger.debug("[InterviewQuestionAgent] Running question generation")

        if state.stop_pipeline:
            logger.info("[InterviewQuestionAgent] Pipeline stopped, skipping question generation.")
            return state

        parsed_cv = state.parsed_cv or {}
        matched_jd = state.matched_jd or {}

        name = parsed_cv.get("name", "the candidate")
        skills = parsed_cv.get("skills", [])
        experience = parsed_cv.get("experience_years", 0)
        position = matched_jd.get("position", "this role")
        level = matched_jd.get("level", "junior")

        question_count = self._get_question_count_by_level(level)

        logger.debug(
            f"[InterviewQuestionAgent] Candidate: {name}, Position: {position}, "
            f"Level: {level}, Experience: {experience}, Skills: {skills}, "
            f"Question Count: {question_count}"
        )

        prompt = f"""
You are a technical interviewer preparing for an interview with {name}, who applied for the position of "{position}" ({level} level).
They have {experience} years of experience and key skills: {', '.join(skills)}.

Please generate {question_count} relevant and personalized interview questions, covering:
- Technical expertise
- Problem solving
- Experience and background
- Communication
- Cultural fit

Return ONLY the questions as a plain list without any introduction or explanation.
"""

        logger.debug(f"[InterviewQuestionAgent] Prompt sent to LLM:\n{prompt.strip()}")

        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            logger.error(f"[InterviewQuestionAgent] LLM invocation failed: {e}")
            state.interview_questions = []
            return state

        try:
            if isinstance(response, dict):
                response = response.get("data", "")
            elif hasattr(response, "text"):
                try:
                    response = response.json().get("data", "")
                except Exception:
                    response = response.text
            elif isinstance(response, bytes):
                response = response.decode("utf-8")
            elif not isinstance(response, str):
                response = str(response)
            response = response.strip()
            if not response:
                raise ValueError("Empty response after normalization")
        except Exception as e:
            logger.error(f"[InterviewQuestionAgent] Invalid or empty LLM response: {e}")
            state.interview_questions = []
            return state

        logger.debug(f"[InterviewQuestionAgent] Raw response:\n{response}")

        questions = []
        try:
            parsed_json = json.loads(response)
            if isinstance(parsed_json, list) and all(isinstance(q, str) for q in parsed_json):
                questions = parsed_json
                logger.info("[InterviewQuestionAgent] Parsed response as JSON array.")
            else:
                raise ValueError("Invalid JSON array format")
        except Exception:
            lines = [line.strip() for line in response.splitlines() if line.strip()]
            questions = [line for line in lines if re.match(r"^\d+[).\-] ", line) or re.match(r"^[-*•] ", line)]
            if not questions:
                questions = [line for line in lines if not re.search(r"\b(?:question|interview|instructions?)\b", line, re.IGNORECASE)]
                if not questions:
                    questions = lines[1:] if len(lines) > 1 else lines
            logger.info("[InterviewQuestionAgent] Parsed response as numbered/bulleted lines.")

        logger.info(f"[InterviewQuestionAgent] Generated {len(questions)} questions.")
        for i, q in enumerate(questions, 1):
            logger.debug(f"Q{i}: {q}")

        if len(questions) < 5:
            logger.warning(
                f"[InterviewQuestionAgent] Only {len(questions)} questions generated (expected at least 5)."
            )

        state.interview_questions = questions
        return state