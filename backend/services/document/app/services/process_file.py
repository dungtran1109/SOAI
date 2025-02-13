import logging
import requests
from io import BytesIO
from services.parser import get_parser

logger = logging.getLogger(__file__)

KNOWLEDGE_BASE_URL = "http://knowledge_base:8001/api/v1/knowledge-base/documents"


class ProcessFile:
    @staticmethod
    def process_file(file_path: str, file_extension: str):
        """Process the file in the background."""
        try:
            parser = get_parser(file_extension)
            if not parser:
                logger.error(f"Unsupported file type: {file_extension}")
                return

            with open(file_path, "rb") as f:
                file_stream = BytesIO(f.read())

            list_extracted_texts = parser.extract_text(file_stream)
            logger.info(f"File processed successfully: {file_path}")
            response = requests.post(
                KNOWLEDGE_BASE_URL + "/add", json={"texts": list_extracted_texts}
            )
            if response.status_code == 201:
                logger.info("Data sent to knowledge base successfully.")
            else:
                logger.error(
                    f"Failed to send data to knowledge base. Response: {response.text}"
                )

        except Exception as e:
            logger.exception(f"Error processing file: {file_path}")
