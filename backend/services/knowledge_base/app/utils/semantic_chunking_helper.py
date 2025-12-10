"""An util is to chunk the documents by using semantic chunking"""

import copy
import re
import logging
from typing import List, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__file__)


class SematicChunkingHelper:
    """A class helper to chunk the texts by sematic chunking"""

    def __init__(
        self,
        docs,
        embeddings: Embeddings,
        buffer_size=1,
        breakpoint_threshold=95,
        add_start_index=False,
    ):
        """
        Init and do semantic chunking
        docs: A filtered document
        embeddings: A LLM to embed sentences
        buffer_size:
        breakpoint_threshold
        """
        logger.info("Do semantic chunking")
        self.buffer_size = buffer_size
        self.breakpoint_percentile_threshold = breakpoint_threshold
        self.add_start_index = add_start_index
        sentences = self.split_sentences_from_docs(docs)
        combined_sentences = self.combine_sentences(sentences=sentences)
        self.embeddings = self.embed_documents_from_combined_sentences(
            embeddings, combined_sentences
        )
        distances, _ = self.calculate_cosine_distances(combined_sentences)
        self.text_chunks = self.get_chunks(distances, combined_sentences)

    def split_sentences_from_docs(self, docs: list) -> list:
        """Split the texts from docs"""
        sentences_to_dict = []
        for doc in docs:
            single_sentences_list = re.split(r"(?<=[.?!\n])\s+", doc.page_content)
            for i, x in enumerate(single_sentences_list):
                sentences_to_dict.append({"sentence": x, "index": i})

        logger.info(
            "semantic_chunking.split_sentences_from_docs: Found %s sentences",
            len(sentences_to_dict),
        )

        return sentences_to_dict

    def combine_sentences(self, sentences: list[dict]) -> list:
        """
        Combine sentences from dict
        sentences: is the list of dicts without "." "?" and "!"
        buffer_size: is configurable so you can select how big of a window you want
        """
        logger.info("semantic_chunking.combine_sentences")

        # Go through each sentence dict
        for i, _ in enumerate(sentences):

            # Create a string that will hold the sentences which are joined
            combined_sentence = ""

            # Add sentences before the current one, based on the buffer size.
            for j in range(i - self.buffer_size, i):
                # Check if the index j is not negative
                # (to avoid index out of range like on the first one)
                if j >= 0:
                    # Add the sentence at index j to the combined_sentence string
                    combined_sentence += sentences[j]["sentence"] + " "

            # Add the current sentence
            combined_sentence += sentences[i]["sentence"]

            # Add sentences after the current one, based on the buffer size
            for j in range(i + 1, i + 1 + self.buffer_size):
                # Check if the index j is within the range of the sentences list
                if j < len(sentences):
                    # Add the sentence at index j to the combined_sentence string
                    combined_sentence += " " + sentences[j]["sentence"]

            # Then add the whole thing to your dict
            # Store the combined sentence in the current sentence dict
            sentences[i]["combined_sentence"] = combined_sentence

        return sentences

    def calculate_cosine_distances(self, sentences):
        """Calculate the cosine distances"""
        logger.info("semantic_chunking.calculate_cosine_distances")
        distances = []
        for i in range(len(sentences) - 1):
            embedding_current = sentences[i]["combined_sentence_embedding"]
            embedding_next = sentences[i + 1]["combined_sentence_embedding"]

            # Calculate cosine similarity
            similarity = cosine_similarity([embedding_current], [embedding_next])[0][0]

            # Convert to cosine distance
            distance = 1 - similarity

            # Append cosine distance to the list
            distances.append(distance)

            # Store distance in the dictionary
            sentences[i]["distance_to_next"] = distance

        return distances, sentences

    def embed_documents_from_combined_sentences(
        self, embeddings: Embeddings, combined_sentences
    ):
        """Embed docs to Embeddings
        embeddings: LLM
        combined_sentences:
        """
        logger.info("semantic_chunking.embed_documents_from_combined_sentences")
        new_embeddings = embeddings.embed_documents(
            [x["combined_sentence"] for x in combined_sentences]
        )

        for i, sentence in enumerate(combined_sentences):
            sentence["combined_sentence_embedding"] = new_embeddings[i]

        return new_embeddings

    def get_chunks(self, distances, sentences):
        """Get chunks from the distances with breakpoint percentile
        distances: a list of a distance calculated by cosine similarity
        sentences: a list of combined sentences that alr splitted
        breakpoint_percentile_threshold: If you want more chunks, lower the percentile cutoff
        """
        breakpoint_distance_threshold = np.percentile(
            distances, self.breakpoint_percentile_threshold
        )

        indices_above_thresh = [
            i for i, x in enumerate(distances) if x > breakpoint_distance_threshold
        ]

        # Initialize the start index
        start_index = 0

        # Create a list to hold the grouped sentences
        chunks = []
        # Iterate through the breakpoints to slice the sentences
        for index in indices_above_thresh:
            # The end index is the current breakpoint
            end_index = index

            # Slice the sentence_dicts from the current start index to the end index
            group = sentences[start_index : end_index + 1]
            combined_text = " ".join([d["sentence"] for d in group])
            chunks.append(combined_text)

            # Update the start index for the next group
            start_index = index + 1

        # The last group, if any sentences remain
        if start_index < len(sentences):
            combined_text = " ".join([d["sentence"] for d in sentences[start_index:]])
            chunks.append(combined_text)

        logger.info("semantic_chunking.get_chunks: Found %s chunks", len(chunks))
        return chunks

    def create_documents(
        self, texts: list, metadatas: Optional[List[dict]] = None
    ) -> List[Document]:
        """Create documents from a list of texts."""
        logger.info("semantic_chunking.create_documents: %s chunks", len(texts))
        # _metadatas = metadatas or [{}] * len(texts)
        documents = []
        for i, text in enumerate(texts):
            index = -1
            # for chunk in text:
            #     metadata = copy.deepcopy(_metadatas[i])
            #     if self.add_start_index:
            #         index = text.find(chunk, index + 1)
            #         metadata["start_index"] = index
            # metadata = copy.deepcopy(_metadatas[i])
            new_doc = Document(page_content=text)
            documents.append(new_doc)
        logger.info("semantic_chunking.create_documents: Found %s docs", len(documents))
        return documents
