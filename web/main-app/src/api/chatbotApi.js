import { API_BASE_URL } from "../constants/constants";
import { getToken } from "./authApi";

export const sendMessageToAPI = async (message, model, collection_name) => {
    try {
        const token = getToken();
        const payload = {
            model: model,
            messages: [{ role: "user", content: message }],
            temperature: 0.5,
            collection_name: collection_name
        };

        const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = "";
        let executedModel = "";
        let executionTime = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode chunk and parse JSON
            const decodedChunk = decoder.decode(value, { stream: true }).trim();
            if (!decodedChunk) continue; // Skip empty responses

            // Some APIs might send multiple JSON objects in one chunk
            const jsonChunks = decodedChunk.split("\n").filter(Boolean);
            for (const jsonChunk of jsonChunks) {
                try {
                    const parsedChunk = JSON.parse(jsonChunk);
                    if (parsedChunk.message?.content) {
                        botResponse += parsedChunk.message.content; // Append content
                    }
                    if (parsedChunk.model) {
                        executedModel = parsedChunk.model; // Capture executed model
                        console.log(executedModel);
                    }
                    if (parsedChunk.total_duration) {
                        executionTime = parsedChunk.total_duration / 1e9; // Convert nanoseconds to seconds
                        console.log(executionTime);
                    }
                } catch (error) {
                    console.error("Error parsing JSON chunk:", jsonChunk, error);
                }
            }
        }

        return { reply: botResponse.trim(), executedModel, executionTime };
    } catch (error) {
        console.error("Streaming API error:", error);
        return { reply: "Sorry, something went wrong. Please try again." };
    }
};

export const getSupportedModels = async () => {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/v1/chat/models`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch models");

        const data = await response.json();

        // Extract model names from `data`
        const models = data.data ? data.data.map(model => model.name) : [];
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        return []; // Return empty array if error occurs
    }
};
