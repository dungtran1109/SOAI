from langgraph.graph import StateGraph, END
from utils.email_sender import EmailSender
from agents.state import RecruitmentState
from agents.cv_parser_agent import CVParserAgent
from agents.jd_fetcher_agent import JDFetcherAgent
from agents.matching_agent import MatchingAgent
from agents.approver_agent import ApproverAgent
from agents.final_decision_agent import FinalDecisionAgent
from config.constants import *
from config.log_config import AppLogger
from agents.genai import GenAI

logger = AppLogger(__name__)
# ======================================
# Build RecruitmentGraph_Matching
# ======================================
def build_recruitment_graph_matching(db_session):
    """Build graph for initial CV Parsing + JD Matching."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set.")

    llm = GenAI(
        model=DEFAULT_MODEL,
        temperature=0,
    )

    graph = StateGraph(RecruitmentState)

    # Create nodes
    cv_parser_agent = CVParserAgent(llm)
    jd_fetcher_agent = JDFetcherAgent(db_session)
    matching_agent = MatchingAgent(llm)

    # Add nodes to graph
    graph.add_node("cv_parser_node", cv_parser_with_log(cv_parser_agent))
    graph.add_node("jd_fetcher_node", jd_fetcher_with_log(jd_fetcher_agent))
    graph.add_node("matcher_node", matcher_with_log(matching_agent))

    # Define flow
    graph.set_entry_point("cv_parser_node")
    graph.add_edge("cv_parser_node", "jd_fetcher_node")
    graph.add_edge("jd_fetcher_node", "matcher_node")
    graph.add_edge("matcher_node", END)

    logger.info("RecruitmentGraph_Matching built and compiled.")
    return graph.compile()


# ======================================
# Build RecruitmentGraph_Approval
# ======================================
def build_recruitment_graph_approval(db_session, email_sender: EmailSender):
    """Build graph for Dev Approval + Final Decision."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set.")

    llm = GenAI(
        model=DEFAULT_MODEL,
        temperature=0,
    )

    graph = StateGraph(RecruitmentState)
    approver_agent = ApproverAgent(llm)
    final_decision_agent = FinalDecisionAgent(email_sender, db_session)

    graph.add_node("approver_node", approver_with_log(approver_agent))
    graph.add_node("final_decision_node", final_decision_with_log(final_decision_agent))

    graph.set_entry_point("approver_node")
    graph.add_edge("approver_node", "final_decision_node")
    graph.add_edge("final_decision_node", END)
    # TODO(): Generate list of interview questions when CV is approved

    logger.info("RecruitmentGraph_Approval built and compiled.")
    return graph.compile()


# ======================================
# Wrappers - Corrected Merge State
# ======================================


def cv_parser_with_log(agent: CVParserAgent):
    def wrapper(state):
        logger.debug("[cv_parser] Starting...")
        if isinstance(state, RecruitmentState):
            state_obj = state
        else:
            state_obj = RecruitmentState(**state)

        result = agent.run(state_obj)
        updated_fields = result.model_dump()
        merged_state = {**state_obj.model_dump(), **updated_fields}
        logger.debug(f"[cv_parser] Merged state: {merged_state}")
        return merged_state

    return wrapper


def jd_fetcher_with_log(agent: JDFetcherAgent):
    def wrapper(state):
        logger.debug("[jd_fetcher] Starting...")
        if isinstance(state, RecruitmentState):
            state_obj = state
        else:
            state_obj = RecruitmentState(**state)

        result = agent.run(state_obj)
        updated_fields = result.model_dump()
        merged_state = {**state_obj.model_dump(), **updated_fields}
        logger.debug(f"[jd_fetcher] Merged state: {merged_state}")
        return merged_state

    return wrapper


def matcher_with_log(agent: MatchingAgent):
    def wrapper(state):
        logger.debug("[matcher] Starting...")
        if isinstance(state, RecruitmentState):
            state_obj = state
        else:
            state_obj = RecruitmentState(**state)

        result = agent.run(state_obj)
        updated_fields = result.model_dump()
        merged_state = {**state_obj.model_dump(), **updated_fields}
        logger.debug(f"[matcher] Merged state: {merged_state}")
        return merged_state

    return wrapper


def approver_with_log(agent: ApproverAgent):
    def wrapper(state):
        logger.debug("[approver] Starting...")
        if isinstance(state, RecruitmentState):
            state_obj = state
        else:
            state_obj = RecruitmentState(**state)

        result = agent.run(state_obj)
        updated_fields = result.model_dump()
        merged_state = {**state_obj.model_dump(), **updated_fields}
        logger.debug(f"[approver] Merged state: {merged_state}")
        return merged_state

    return wrapper


def final_decision_with_log(agent: FinalDecisionAgent):
    def wrapper(state):
        logger.debug("[final_decision] Starting...")
        if isinstance(state, RecruitmentState):
            state_obj = state
        else:
            state_obj = RecruitmentState(**state)

        result = agent.run(state_obj)
        updated_fields = result.model_dump()
        merged_state = {**state_obj.model_dump(), **updated_fields}
        logger.debug(f"[final_decision] Merged state: {merged_state}")
        return merged_state

    return wrapper
