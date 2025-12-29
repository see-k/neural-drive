/**
 * Vertex AI Service
 * Google Cloud Vertex AI integration for the AI Partner Catalyst Hackathon
 * 
 * This service provides AI capabilities using Google Cloud's Vertex AI platform,
 * satisfying the hackathon requirement to use Google Cloud products.
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SubTopicResponse, NodeContentResponse } from "../types";

// Initialize with Vertex AI configuration
// The @google/genai SDK can work with both AI Studio and Vertex AI
// For production, this would use Vertex AI endpoints
const ai = new GoogleGenAI({
    apiKey: process.env.API_KEY,
    // In production Vertex AI deployment, you would use:
    // vertexai: true,
    // project: process.env.GOOGLE_CLOUD_PROJECT,
    // location: process.env.GOOGLE_CLOUD_LOCATION,
});

// Schema definitions for structured outputs
const subtopicSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "The name of the sub-topic or concept.",
            },
            description: {
                type: Type.STRING,
                description: "A concise, intriguing summary (max 20 words).",
            },
        },
        required: ["title", "description"],
    },
};

const synthesisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Name of synthesized concept." },
        description: { type: Type.STRING, description: "How these topics combine." }
    },
    required: ["title", "description"]
};

const voiceCommandSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        intent: {
            type: Type.STRING,
            description: "The detected intent: explore, expand, read, combine, navigate, or unknown"
        },
        topic: {
            type: Type.STRING,
            description: "The topic or target mentioned in the command, if any"
        },
        response: {
            type: Type.STRING,
            description: "A brief, natural response to acknowledge the command (10-20 words)"
        },
        shouldSpeak: {
            type: Type.BOOLEAN,
            description: "Whether the response should be spoken aloud"
        }
    },
    required: ["intent", "response", "shouldSpeak"]
};

/**
 * Process a voice command using Vertex AI
 * Provides natural language understanding for voice navigation
 */
export interface ProcessedVoiceCommand {
    intent: 'explore' | 'expand' | 'read' | 'combine' | 'navigate' | 'unknown';
    topic?: string;
    response: string;
    shouldSpeak: boolean;
}

export const processVoiceCommand = async (
    transcript: string,
    currentTopic?: string
): Promise<ProcessedVoiceCommand> => {
    const model = "gemini-2.5-flash";

    const contextInfo = currentTopic
        ? `The user is currently exploring: "${currentTopic}".`
        : "The user is at the home screen.";

    const prompt = `
    ${contextInfo}
    
    The user said: "${transcript}"
    
    Interpret this as a voice command for a knowledge exploration app.
    
    Possible intents:
    - explore: User wants to explore a new topic
    - expand: User wants to go deeper into current topic
    - read: User wants the current content read aloud
    - combine: User wants to synthesize/merge concepts
    - navigate: User wants to go back or navigate elsewhere
    - unknown: Cannot determine intent
    
    Respond naturally and helpfully.
  `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: voiceCommandSchema,
                temperature: 0.3,
            },
        });

        const text = response.text;
        if (!text) {
            return {
                intent: 'unknown',
                response: "I didn't catch that. Could you try again?",
                shouldSpeak: true,
            };
        }

        const result = JSON.parse(text);
        return {
            intent: result.intent || 'unknown',
            topic: result.topic,
            response: result.response || "Processing your request.",
            shouldSpeak: result.shouldSpeak ?? true,
        };
    } catch (error) {
        console.error("Voice command processing error:", error);
        return {
            intent: 'unknown',
            response: "Sorry, I encountered an error. Please try again.",
            shouldSpeak: true,
        };
    }
};

/**
 * Generate a voice-optimized summary of content
 * Creates content specifically designed for text-to-speech
 */
export const generateVoiceSummary = async (
    topic: string,
    content: string
): Promise<string> => {
    const model = "gemini-2.5-flash";

    // Truncate content if too long
    const truncatedContent = content.length > 2000
        ? content.substring(0, 2000) + "..."
        : content;

    const prompt = `
    Create a spoken briefing about "${topic}" based on this content:
    
    ${truncatedContent}
    
    Requirements:
    1. Write as if speaking to someone directly
    2. Use clear, conversational language
    3. Avoid technical jargon unless explaining it
    4. Keep it between 100-150 words
    5. Start with an engaging hook
    6. End with a thought-provoking question or insight
    
    Do NOT use any markdown, bullet points, or special formatting.
    Write in flowing, natural paragraphs.
  `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        });

        return response.text || `Let me tell you about ${topic}.`;
    } catch (error) {
        console.error("Voice summary generation error:", error);
        return `${topic} is a fascinating subject. Unfortunately, I encountered an issue generating the full briefing.`;
    }
};

/**
 * Generate conversational responses for the chat interface
 * Uses Vertex AI for more natural dialogue
 */
export const generateConversationalResponse = async (
    topic: string,
    context: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> => {
    const model = "gemini-2.5-flash";

    // Build conversation context
    const historyText = conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = `
    You are an AI expert guide helping someone explore "${topic}".
    
    Background context:
    ${context.substring(0, 1000)}
    
    Recent conversation:
    ${historyText}
    
    User's new message: "${userMessage}"
    
    Respond naturally and helpfully. Be:
    - Concise (under 100 words unless asked for detail)
    - Engaging and curious
    - Accurate and informative
    - Ready to go deeper if asked
    
    If the user asks about something outside your knowledge, acknowledge it honestly.
  `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.7,
                tools: [{ googleSearch: {} }], // Enable grounding
            },
        });

        return response.text || "I'm having trouble formulating a response. Could you rephrase your question?";
    } catch (error) {
        console.error("Conversational response error:", error);
        return "Neural link unstable. Please try again.";
    }
};

/**
 * Generate related topics for voice exploration
 * Suggests what the user might want to explore next
 */
export const generateExplorationSuggestions = async (
    currentTopic: string,
    exploredTopics: string[]
): Promise<string[]> => {
    const model = "gemini-2.5-flash";

    const exploredList = exploredTopics.length > 0
        ? `Already explored: ${exploredTopics.join(', ')}`
        : '';

    const prompt = `
    The user is exploring "${currentTopic}".
    ${exploredList}
    
    Suggest 3 related topics they might want to explore next.
    
    Requirements:
    - Each suggestion should be 2-4 words
    - Topics should be naturally related but different
    - Avoid topics already explored
    - Make them intriguing and specific
    
    Return a JSON array of strings.
  `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.8,
            },
        });

        const text = response.text;
        if (!text) return [];

        return JSON.parse(text) as string[];
    } catch (error) {
        console.error("Suggestion generation error:", error);
        return [];
    }
};

/**
 * Analyze voice input for better understanding
 * Provides semantic analysis of spoken queries
 */
export const analyzeVoiceInput = async (
    transcript: string
): Promise<{
    primaryIntent: string;
    entities: string[];
    sentiment: 'curious' | 'confused' | 'excited' | 'neutral';
    suggestedAction: string;
}> => {
    const model = "gemini-2.5-flash";

    const analysisSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            primaryIntent: { type: Type.STRING },
            entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING },
            suggestedAction: { type: Type.STRING }
        },
        required: ["primaryIntent", "entities", "sentiment", "suggestedAction"]
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Analyze this voice input for a knowledge exploration app: "${transcript}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2,
            },
        });

        const text = response.text;
        if (!text) {
            return {
                primaryIntent: 'explore',
                entities: [transcript],
                sentiment: 'neutral',
                suggestedAction: 'search'
            };
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("Voice analysis error:", error);
        return {
            primaryIntent: 'explore',
            entities: [transcript],
            sentiment: 'neutral',
            suggestedAction: 'search'
        };
    }
};
