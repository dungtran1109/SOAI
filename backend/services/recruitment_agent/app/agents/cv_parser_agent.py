import json
from utils.pdf_parser import extract_text_from_pdf
from langchain_openai import ChatOpenAI
from agents.base_agent import BaseAgent
from agents.state import RecruitmentState

class CVParserAgent(BaseAgent):
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    def run(self, state: RecruitmentState) -> RecruitmentState:
        if state.stop_pipeline:
            return state
        
        text = extract_text_from_pdf(state.cv_file_path)

        prompt = f"""
You are an ATS parser. From the following CV text, extract:
- name (string)
- email (string)
- skills (list of string)
- experience_years (integer)

CV Content:
{text}

Respond ONLY the JSON. No explanation, no comment.
"""

        response = self.llm.invoke(prompt)

        if not response.content or response.content.strip() == "":
            raise ValueError("Received empty response from LLM.")

        content = response.content.strip()

        # Clean up Markdown formatting if any
        if content.startswith("```json") and content.endswith("```"):
            content = content[7:-3].strip()
        elif content.startswith("```") and content.endswith("```"):
            content = content[3:-3].strip()

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON from LLM after cleaning: {content}") from e

        state.parsed_cv = parsed
        return state