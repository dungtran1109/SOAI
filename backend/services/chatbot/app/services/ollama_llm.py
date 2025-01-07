import json
import logging
from typing import Optional
import requests
from langchain.llms.base import LLM
logger = logging.getLogger(__file__)


class OllamaLLM(LLM):
    """
    Custom LangChain LLM wrapper for querying Ollama API.
    """

    OLLAMA_URL = "http://ollama:11434"

    @property
    def _llm_type(self) -> str:
        return "ollama"

    def _call(
        self, prompt: str, stop: Optional[list[str]] = None, model: str = "llama3.2"
    ) -> str:
        """
        Query the Ollama API with a specific model and prompt.
        """
        payload = {"model": model, "messages": [{"role": "user", "content": prompt}]}
        response = requests.post(
            f"{self.OLLAMA_URL}/api/chat", json=payload, stream=True
        )
        if response.status_code != 200:
            return "Don't know the answer"

        response_str = ""
        for line in response.iter_lines():
            if line:
                # Parse each JSON object
                data = json.loads(line)
                content = data.get("message", {}).get("content", "")
                if not content:
                    continue
                response_str = response_str + content

        return response_str

    def invoke(self, input: str, model: Optional[str] = None) -> str:
        """
        Generate a response with model selection.

        Args:
            input (str]): The input string for the prompt.
            model (Optional[str]): The name of the model to query.

        Returns:
            str: The generated response.
        """
        return self._call(input, model=model)
