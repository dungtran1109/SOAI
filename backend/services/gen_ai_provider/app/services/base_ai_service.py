from abc import ABC, abstractmethod


class BaseAIService(ABC):
    def __init__(self, model: str):
        self.model = model

    @abstractmethod
    def chat(self, messages: list) -> str:
        pass

    @abstractmethod
    def get_available_models(self):
        pass
