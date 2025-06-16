from abc import ABC, abstractmethod
from agents.state import RecruitmentState


class BaseAgent(ABC):
    @abstractmethod
    def run(self, state: RecruitmentState) -> RecruitmentState:
        """
        Run the agent with a given RecruitmentState and return the updated state.
        """
        pass
