import { useState } from "react";
import useChatbot from "../hooks/useChatbot";

const Chatbot = () => {
    const { messages, sendMessage, loading, selectedModel, setSelectedModel, collectionName, setCollectionName, executedModel, executionTime, models, modelsLoading } = useChatbot();
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input);
            setInput("");
        }
    };
    return (
        <div className="chatbot-container">
            <div className="chat-options">
                <label>Select Model:</label>
                {modelsLoading ? (
                    <p>Loading models...</p>
                ) : (
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                        {models.map((model, index) => (
                            <option key={index} value={model}>{model}</option>
                        ))}
                    </select>
                )}
                <label>Collection Name:</label>
                <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Enter collection name (optional)"
                />
            </div>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.type}`}>
                        <div className={`message ${msg.type}`}>
                            {msg.isLoading ? <div className="loading-spinner"></div> : msg.text}
                        </div>
                        {index === messages.length - 1 && msg.type === "bot" && executedModel && (
                            <div className="message-meta">
                                <p><strong>Model:</strong> {executedModel}</p>
                                <p><strong>Execution Time:</strong> {executionTime.toFixed(3)}s</p>
                            </div>
                        )}
                    </div>

                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend} disabled={loading}>
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
