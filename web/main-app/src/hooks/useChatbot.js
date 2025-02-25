import { useState, useEffect } from "react";
import { sendMessageToAPI, getSupportedModels } from "../api/chatbotApi";
import { runModel } from "../api/runModelApi";
const useChatbot = () => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hello! How can I assist you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2"); // Default model
  const [collectionName, setCollectionName] = useState("knowledge_base"); // Default collection
  const [executedModel, setExecutedModel] = useState("");
  const [executionTime, setExecutionTime] = useState(0);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      const availableModels = await getSupportedModels();
      setModels(availableModels);
      if (availableModels.length > 0) {
        setSelectedModel(availableModels[0]); // Default to first model
      }
      setModelsLoading(false);
    };

    fetchModels();
  }, []);
  const sendMessage = async (userMessage) => {
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setLoading(true);

    // Add a placeholder message with a loading indicator
    const loadingMessage = { type: "bot", text: "", isLoading: true };
    setMessages((prev) => [...prev, loadingMessage]);

    const response = await sendMessageToAPI(userMessage, selectedModel, collectionName);
    setLoading(false);

    // Store model execution details
    setExecutedModel(response.executedModel);
    setExecutionTime(response.executionTime);

    // Replace loading message with actual response
    setMessages((prev) => {
      const updatedMessages = [...prev];
      updatedMessages[updatedMessages.length - 1] = { type: "bot", text: response.reply };
      return updatedMessages;
    });
  };

  return { messages, sendMessage, loading, selectedModel, setSelectedModel, collectionName, setCollectionName, executedModel, executionTime, models, modelsLoading };
};

export default useChatbot;
