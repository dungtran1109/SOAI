import os
import streamlit as st
from rag import RAG
from constants import SOURCE_DIRECTORY, DOCUMENT_MAP, PERSIST_DIRECTORY
from utils import list_file_names, create_source_dir
from utils import list_file_names, create_source_dir


def ask_answer_messages(vector_db_ready=False):
    if vector_db_ready:
        if (
            st.session_state.get("messages") is not None
            and len(st.session_state.get("messages")) == 1
        ):
            # db is ready start new messages
            st.session_state.pop("messages")
    else:
        if st.session_state.get("messages") is not None:
            # db isn't ready start new messages with not ready message
            st.session_state.pop("messages")

    if "messages" not in st.session_state or not st.session_state.get("messages"):
        if vector_db_ready:
            st.session_state["messages"] = [
                {
                    "role": "assistant",
                    "content": "Hi, I'm DEK Chatbot, How can I help you?",
                }
            ]
        else:
            st.session_state["messages"] = [
                {
                    "role": "assistant",
                    "content": "I am not ready yet. Could you please upload documents to the system for ingestion?",
                }
            ]

    for msg in st.session_state.messages:
        st.chat_message(msg["role"]).write(msg["content"])

    if user_text := st.chat_input(placeholder="Type your message here..."):
        st.session_state.messages.append({"role": "user", "content": user_text})
        st.chat_message("user").write(user_text)

        if user_text:
            with st.spinner("Thinking..."):
                response = st.session_state["assistant"].ask(user_text)
                agent_text = response["answer"]
                references = response["context"]
                if len(references) > 0 and any(
                    ref.page_content != "" for ref in references[1:]
                ):
                    agent_text += "\n\n----------------------------------SOURCE DOCUMENTS----------------------------------\n\n"
                    for reference in references:
                        agent_text += reference.page_content

        st.chat_message("assistant").write(agent_text)
        st.session_state.messages.append({"role": "assistant", "content": agent_text})


def ingest():
    def disable():
        st.session_state.disabled = True

    with st.sidebar.form(key="FormIngest"):
        ingest_submitted = st.form_submit_button(
            "Ingest", on_click=disable, disabled=st.session_state.disabled
        )

    if ingest_submitted:
        with st.spinner("Ingesting..."):
            st.session_state["assistant"].ingest_docs_from_source_dir()
            ask_answer_messages(load_retriever())

            st.session_state.disabled = False
            st.rerun()


def show_files():
    """show_files"""
    st.sidebar.table(list_file_names(SOURCE_DIRECTORY))


def upload():
    """Read and save file to dir"""

    def read_and_save_file():
        file_names = list_file_names(SOURCE_DIRECTORY)
        new_file_uploaded = False
        for file in st.session_state["file_uploader"]:
            if file.name in file_names:
                st.write(f"{file.name} is already uploaded")
                continue

            with open(os.path.join(SOURCE_DIRECTORY, file.name), "wb") as tf:
                tf.write(file.getbuffer())

        if new_file_uploaded:
            show_files()

    if "sbstate" not in st.session_state:
        st.session_state.sbstate = "collapsed"

    with st.sidebar:
        st.sidebar.header("Settings")
        st.sidebar.file_uploader(
            "Upload document",
            type=DOCUMENT_MAP.keys(),
            key="file_uploader",
            on_change=read_and_save_file,
            label_visibility="collapsed",
            accept_multiple_files=True,
            disabled=st.session_state.disabled,
        )


def load_retriever():
    """Load retriever from session state"""
    return st.session_state["assistant"].load_retriever()


def init():
    """Init"""
    if "disabled" not in st.session_state:
        st.session_state.disabled = False

    # Create source dir at the beginning
    create_source_dir(SOURCE_DIRECTORY)


def sidebar():
    """Build sidebar"""
    upload()
    show_files()
    ingest()


def select_model():
    """Select LLM"""
    option = None
    if "selected_llm" not in st.session_state:
        st.session_state.selected_llm = None
    while not option:
        option = st.selectbox(
            "Select a model to run interference", ("phi3", "llama2", "llama3")
        )
        if st.session_state.selected_llm != option:
            st.session_state.selected_llm = option
            st.session_state["assistant"] = RAG(option)
        st.write("You selected:", option)


def main_page():
    """Build main UI"""
    st.set_page_config(
        page_title="DEK ChatBot",
        layout="wide",
        initial_sidebar_state=st.session_state.get("sbstate", "collapsed"),
    )
    st.header("Welcome to DEK ChatBot")
    st.session_state["ingestion_spinner"] = st.empty()
    init()
    select_model()
    sidebar()
    ask_answer_messages(load_retriever())


if __name__ == "__main__":
    main_page()
