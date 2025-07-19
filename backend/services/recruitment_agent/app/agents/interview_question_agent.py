from agents.state import RecruitmentState
from config.log_config import AppLogger
import json
import re

logger = AppLogger(__name__)

class InterviewQuestionAgent:
    def __init__(self, llm):
        self.llm = llm  # LLM service instance

    def run(self, state: RecruitmentState) -> RecruitmentState:
        logger.debug("[InterviewQuestionAgent] Running question generation")

        if state.stop_pipeline:
            logger.info("[InterviewQuestionAgent] Pipeline stopped, skipping question generation.")
            return state

        parsed_cv = state.parsed_cv or {}
        matched_jd = state.matched_jd or {}

        name = parsed_cv.get("name", "học sinh")
        skills = parsed_cv.get("skills", [])
        match_score = matched_jd.get("match_score", 80)  # fallback

        position = matched_jd.get("position", "chương trình chuyên")
        subject = self._extract_major_subject(matched_jd.get("skills_required", []))

        # Determine number of questions based on match_score
        if match_score >= 90:
            question_count = 8
        elif match_score >= 75:
            question_count = 6
        else:
            question_count = 4

        logger.debug(
            f"[InterviewQuestionAgent] Candidate: {name}, Subject: {subject}, "
            f"Match Score: {match_score}, Question Count: {question_count}"
        )

        prompt = f"""
You are a Vietnamese high school interviewer. Based on the candidate profile below, write {question_count} **Vietnamese-language** interview questions to assess the student's thinking and subject ability in the specialized program.

Each question should test:
- Thinking ability
- Basic subject understanding (related to {subject})
- Application or creative thinking

Then, provide at least one sample answer for each question. Questions and answers must be written in Vietnamese, suitable for high school students applying to the program "{position}".

Respond in this JSON format only:
[
  {{
    "question": "Câu hỏi bằng tiếng Việt?",
    "answers": ["Câu trả lời mẫu 1", "Câu trả lời mẫu 2 (nếu có)"]
  }},
  ...
]

Return only valid JSON. No explanation or markdown.
""".strip()

        logger.debug(f"[InterviewQuestionAgent] Prompt sent to LLM:\n{prompt}")

        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            logger.error(f"[InterviewQuestionAgent] LLM invocation failed: {e}")
            state.interview_questions = []
            return state

        # === Normalize and extract content
        try:
            if isinstance(response, dict):
                response = response.get("data", "")
            elif hasattr(response, "json"):
                response = response.json().get("data", "")
            elif hasattr(response, "text"):
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

        # === Parse JSON Q&A
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
            logger.warn(f"[InterviewQuestionAgent] JSON parsing failed: {e}")
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

        if len(qa_pairs) < 3:
            logger.warn(f"[InterviewQuestionAgent] Only {len(qa_pairs)} questions generated (expected at least 3).")

        state.interview_questions = qa_pairs
        return state

    def _extract_major_subject(self, skills_required: list) -> str:
        """Try to extract the main subject from skills_required"""
        if not skills_required:
            return ""
        for s in skills_required:
            if isinstance(s, str) and ":" in s:
                return s.split(":")[0]
        return skills_required[0] if isinstance(skills_required[0], str) else ""
