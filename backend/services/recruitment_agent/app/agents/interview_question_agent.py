from agents.state import RecruitmentState
from config.log_config import AppLogger
import json
import re

logger = AppLogger(__name__)

class InterviewQuestionAgent:
    def __init__(self, llm):
        self.llm = llm  # LLM service instance

    def _get_question_count_by_level(self, level: str) -> int:
        """Return number of questions based on candidate level using regex match."""
        level_map = [
            (r"intern", 5),
            (r"fresher", 10),
            (r"junior", 15),
            (r"mid", 20),
            (r"senior", 25),
            (r"lead", 30),
            (r"architect", 35),
        ]
        for pattern, count in level_map:
            if re.search(pattern, level, re.IGNORECASE):
                return count
        return 20  # fallback

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

        if state.cv_summary:
            prompt = f"""
You are a technical interviewer preparing to interview {name} for the position of "{position}" ({level} level).
Here is a summary of the candidate's profile:

{state.cv_summary}

Generate {question_count} personalized interview questions. For each question, also provide at least one appropriate answer (can be multiple).

Return the output strictly in JSON format:
[
  {{
    "question": "Your question?",
    "answers": ["Answer 1...", "Answer 2 (if any)..."]
  }},
  ...
]
Do not include any explanation, formatting, or headers outside this JSON array.
""".strip()
        else:
            prompt = f"""
You are a technical interviewer preparing for an interview with {name}, who applied for the position of "{position}" ({level} level).
They have {experience} years of experience and key skills: {', '.join(skills)}.

Generate {question_count} relevant interview questions. For each question, also provide at least one possible answer (can be multiple).

Return the output strictly in JSON format:
[
  {{
    "question": "Your question?",
    "answers": ["Answer 1...", "Answer 2 (if any)..."]
  }},
  ...
]
No explanation or formatting outside this JSON array.
""".strip()

        logger.debug(f"[InterviewQuestionAgent] Prompt sent to LLM:\n{prompt}")

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

        qa_pairs = []

        try:
            parsed_json = json.loads(response)
            if isinstance(parsed_json, list):
                for item in parsed_json:
                    question = item.get("question")
                    answers = item.get("answers", [])
                    if question and isinstance(answers, list) and all(isinstance(ans, str) for ans in answers):
                        qa_pairs.append({"question": question, "answers": answers})
            if not qa_pairs:
                raise ValueError("No valid Q&A pairs found")
            logger.info("[InterviewQuestionAgent] Parsed response as Q&A JSON.")
        except Exception as e:
            logger.warning(f"[InterviewQuestionAgent] JSON parsing failed: {e}")
            qa_pairs = []
            lines = [line.strip() for line in response.splitlines() if line.strip()]
            current_q = None
            for line in lines:
                if re.match(r"^\d+[).\-] ", line) or re.match(r"^[-*•] ", line):
                    if current_q:
                        qa_pairs.append(current_q)
                    current_q = {"question": line, "answers": []}
                elif current_q:
                    current_q["answers"].append(line)
            if current_q:
                qa_pairs.append(current_q)
            logger.info("[InterviewQuestionAgent] Parsed fallback semi-structured Q&A.")

        logger.info(f"[InterviewQuestionAgent] Generated {len(qa_pairs)} Q&A pairs.")
        for i, item in enumerate(qa_pairs, 1):
            logger.debug(f"Q{i}: {item['question']}")
            for ans in item['answers']:
                logger.debug(f"    A: {ans}")

        if len(qa_pairs) < 5:
            logger.warning(f"[InterviewQuestionAgent] Only {len(qa_pairs)} questions generated (expected at least 5).")

        state.interview_questions = qa_pairs
        return state