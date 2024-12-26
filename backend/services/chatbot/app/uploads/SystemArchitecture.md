# System architecture for chatbot with the Retrieval-Augmented Generation (RAG) technique:

**Components:**

1. **User Interface (UI):**

   - Implemented with Streamlit.
   - Provides a text box for user input and displays the chatbot's response.
   - Provides a upload docs and ingest button.

2. **Streamlit App:**

   - A Python script facilitating communication between UI and Langchain.
   - Captures user input from the UI.
   - Sends the input to Langchain for processing.
   - Displays the chatbot response received from Langchain.

3. **Langchain Pipeline :** This component now incorporates functionalities for RAG:

   - **Retrieval:** It retrieves relevant passages or responses from a knowledge base based on the user input. This knowledge base can be a custom dataset you create or use an external source.
   - **Preprocessing:** Similar to the previous architecture, it cleans and prepares user input for further processing.
   - **Ollama Interaction:** It sends the preprocessed input to Ollama for response generation.
   - **Response Augmentation:** It combines the retrieved information from the knowledge base with the generated response from Ollama. This might involve selecting the most relevant retrieved passage or summarizing it to enhance the response's context and factual accuracy.
   - **Postprocessing:** It refines the augmented response for better readability and coherence.

4. **Knowledge Base:** This is a new component that stores relevant information for retrieval. It can be a structured database, a collection of documents, or any source containing data suitable for chatbot responses.

5. **Ollama:** This remains the same, providing access to large language models for generating creative and informative responses.
   - Ollama is an open-source framework that empowers users to run large language models (LLMs) directly on their local systems. It simplifies the process of setting up, interacting with, and managing these powerful AI models
   - Interacts with the chosen LLM based on configuration (e.g.,Phi3, Llama 2, Llama 3, or Mistral).
   - Returns the generated response to the user's input.
   - we have to install ollama service on linux, macs and windows on https://ollama.com/. Go to download

**Interactions:**

1. User types a message in the Streamlit UI text box.
2. Streamlit app captures the user input and sends it to the Langchain pipeline.
3. Langchain performs retrieval from the knowledge base based on the user input.
4. Langchain preprocesses the user input.
5. Langchain sends the preprocessed input to Ollama.
6. Ollama generates a response based on the user input.
7. Langchain retrieves relevant information from the knowledge base.
8. Langchain augments the Ollama-generated response with retrieved information.
9. Langchain postprocesses the augmented response.
10. Langchain sends the final response back to the Streamlit app.
11. Streamlit app displays the chatbot's response in the UI.

**Benefits of RAG in this Architecture:**

- Improved accuracy and factuality of chatbot responses by leveraging the knowledge base.
- More contextually relevant responses due to the combination of retrieved information and Ollama's generative capabilities.
- Enhanced user experience with informative and grounded responses.

