import logging
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed

from constants import *

from langchain.docstore.document import Document

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__file__)


class RAGIngest:
    def load_single_document(file_path: str) -> Document:
        # Loads a single document from a file path
        try:
            file_extension = os.path.splitext(file_path)[1]
            loader_class = DOCUMENT_MAP.get(file_extension)
            if loader_class:
                logger.info(file_path + " loaded.")
                loader = loader_class(file_path)
            else:
                logger.info(file_path + " document type is undefined.")
                raise ValueError("Document type is undefined")
            return loader.load()[0]
        except Exception as ex:
            logger.info("%s loading error: \n%s" % (file_path, ex))
        return None

    def load_document_batch(filepaths):
        logging.info("Loading document batch")
        # create a thread pool
        with ThreadPoolExecutor(len(filepaths)) as exe:
            # load files
            futures = [
                exe.submit(RAGIngest.load_single_document, name) for name in filepaths
            ]
            # collect data
            if futures is None:
                return None
            else:
                data_list = [future.result() for future in futures]
                # return data and file paths
                return (data_list, filepaths)

    def load_documents(source_dir: str) -> list[Document]:
        # Loads all documents from the source documents directory, including nested folders
        paths = []
        for root, _, files in os.walk(source_dir):
            for file_name in files:
                logger.info("Importing: " + file_name)
                file_extension = os.path.splitext(file_name)[1]
                source_file_path = os.path.join(root, file_name)
                if file_extension in DOCUMENT_MAP.keys():
                    paths.append(source_file_path)
        # Have at least one worker and at most INGEST_THREADS workers
        n_workers = min(INGEST_THREADS, max(len(paths), 1))
        chunksize = round(len(paths) / n_workers)
        docs = []
        with ProcessPoolExecutor(n_workers) as executor:
            futures = []
            # split the load operations into chunks
            for i in range(0, len(paths), chunksize):
                # select a chunk of filenames
                filepaths = paths[i : (i + chunksize)]
                # submit the task
                try:
                    future = executor.submit(RAGIngest.load_document_batch, filepaths)
                except Exception as ex:
                    logger.info("executor task failed: %s" % (ex))
                    future = None
                if future is not None:
                    futures.append(future)
            # process all results
            for future in as_completed(futures):
                # open the file and load the data
                try:
                    contents, _ = future.result()
                    docs.extend(contents)
                except Exception as ex:
                    logger.error("Exception: %s" % (ex))

        return docs
