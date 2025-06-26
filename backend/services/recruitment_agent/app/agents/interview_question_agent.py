from agents.state import RecruitmentState
from config.log_config import AppLogger

class InterviewQuestionAgent:
    def __init__(self, llm):
        self.llm = llm

    def run(self, state: RecruitmentState) -> RecruitmentState:
        parsed_cv = state.parsed_cv or {}
        matched_jd = state.matched_jd or {}

        name = parsed_cv.get("name", "the candidate")
        skills = parsed_cv.get("skills", [])
        position = matched_jd.get("position", "this role")
        experience = parsed_cv.get("experience_years", 0)

        prompt = f"""
You are a technical interviewer preparing for an interview with {name}, who applied for the position of "{position}".
They have {experience} years of experience and key skills: {', '.join(skills)}.

Please generate 5 relevant and personalized interview questions, covering:
- Technical expertise
- Problem solving
- Experience and background
- Communication
- Cultural fit
Return only the questions as a list.
"""

        response = self.llm.invoke(prompt)
        questions = response.strip().split("\n")
        return RecruitmentState(
            **state.model_dump(),
            interview_questions=questions
        )
