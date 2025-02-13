from typing import List
from io import BytesIO
import pdfplumber
from docx import Document
import pandas as pd


class DocumentParser:
    """Base class for document parsers"""

    def extract_text(self, file: BytesIO) -> List[str]:
        raise NotImplementedError("Subclasses must implement extract_text method")

    def split_into_chunks(self, text: str, lines_per_chunk: int = 50) -> List[str]:
        lines = text.split("\n")
        return [
            "\n".join(lines[i : i + lines_per_chunk])
            for i in range(0, len(lines), lines_per_chunk)
        ]


class PDFParser(DocumentParser):
    def extract_text(self, file: BytesIO) -> List[str]:
        text = ""
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return self.split_into_chunks(text.strip())


class DOCXParser(DocumentParser):
    def extract_text(self, file: BytesIO) -> List[str]:
        doc = Document(file)
        text = "\n".join([para.text for para in doc.paragraphs])
        return self.split_into_chunks(text)


class CSVParser(DocumentParser):
    def extract_text(self, file: BytesIO) -> List[str]:
        df = pd.read_csv(file)
        text = df.to_string(index=False)
        return self.split_into_chunks(text)


def get_parser(file_extension: str) -> DocumentParser:
    parsers = {
        "pdf": PDFParser(),
        "docx": DOCXParser(),
        "doc": DOCXParser(),
        "csv": CSVParser(),
    }
    return parsers.get(file_extension, None)
