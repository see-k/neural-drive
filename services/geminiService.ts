import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { SubTopicResponse, NodeContentResponse } from "../types";
import { fetchWikipediaData } from "./wikipediaService";
import { getStoredAPIKeys } from "../contexts/APIKeysContext";

// Dynamic Gemini Client Getter
const getAI = () => {
  const { geminiApiKey } = getStoredAPIKeys();
  if (!geminiApiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }
  return new GoogleGenAI({ apiKey: geminiApiKey });
};

const responseSchema: Schema = {
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
        description: "A concise, intriguing summary of what this sub-topic entails (max 20 words).",
      },
    },
    required: ["title", "description"],
  },
};

const synthesisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The name of the synthesized concept." },
    description: { type: Type.STRING, description: "How these two topics combine." }
  },
  required: ["title", "description"]
};

export const fetchSubTopics = async (
  topic: string,
  parentContext?: string
): Promise<SubTopicResponse[]> => {
  const model = getStoredAPIKeys().geminiModel || "gemini-3-flash-preview";

  const contextPrompt = parentContext
    ? `CONTEXT: The user is currently exploring the parent topic "${parentContext}". The topic "${topic}" is a specific branch within "${parentContext}".`
    : "CONTEXT: This is a root topic.";

  const prompt = `
    ${contextPrompt}
    TASK: Analyze the sub-topic "${topic}".
    ACTION: Break this down into 3 to 5 distinct, fundamental sub-branches or deeper concepts.
    CONSTRAINT: The sub-branches MUST be strictly relevant to "${topic}" specifically as it relates to "${parentContext || 'general knowledge'}". 
    - Avoid generic sub-topics.
    - Focus on structural knowledge or fascinating specific niches relevant to the context.
    - If the context is specific (e.g. "SpaceX"), do not give generic results for "Rockets", give results specific to SpaceX Rockets.
    Return strictly JSON.
  `;

  try {
    const response = await getAI().models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as SubTopicResponse[];
    return data;
  } catch (error) {
    console.error("Gemini API Error (Subtopics):", error);
    return [];
  }
};

export const fetchSynthesis = async (topicA: string, topicB: string): Promise<SubTopicResponse | null> => {
  try {
    const response = await getAI().models.generateContent({
      model: getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp",
      contents: `Find the creative intersection, synthesis, or conflict between "${topicA}" and "${topicB}". 
      Create a new concept name (Title) and brief description that bridges these two.
      Example: If inputs are "Biology" and "Technology", output "Bioinformatics" or "Cybernetics".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: synthesisSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as SubTopicResponse;
  } catch (e) {
    console.error("Synthesis Error", e);
    return null;
  }
}

export const generateNodeContent = async (topic: string): Promise<NodeContentResponse> => {
  // 1. Kick off Image Generation (AI) in background as fallback/parallel
  // We do this concurrently to save time, but will discard if Wiki has a good image.
  const aiImagePromise = (async () => {
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { text: `A hyper-modern, cinematic, abstract or symbolic 3D render representation of ${topic}. Cyberpunk aesthetic, neon lighting, dark background, 8k resolution, high detail.` },
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return undefined;
    } catch (e) {
      console.error("Image Gen Error:", e);
      return undefined;
    }
  })();

  // 2. Fetch Content (Wiki or AI Fallback)
  // Define structure for the content data we need
  let contentData: { content: string, sources: { title: string, uri: string }[], imageUrl?: string } = {
    content: "",
    sources: [],
    imageUrl: undefined
  };

  try {
    // Try fetching from Wikipedia first
    const wikiData = await fetchWikipediaData(topic);

    if (wikiData) {
      contentData = {
        content: wikiData.content,
        imageUrl: wikiData.imageUrl,
        sources: [{ title: `Wikipedia: ${wikiData.title}`, uri: wikiData.url }]
      };
    } else {
      // Fallback to Gemini Text Generation if no Wiki page found
      const response = await getAI().models.generateContent({
        model: getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp",
        contents: `Write a comprehensive, deep, and structured encyclopedia article about "${topic}".
        
        Requirements:
        1. Write in clear, engaging, fact-based prose suitable for a deep-dive learning tool.
        2. Structure the content using SEMANTIC HTML tags: <h3> for section headers, <p> for paragraphs, <ul>/<li> for lists, and <strong> for key terms.
        3. DO NOT use markdown.
        4. Include these specific sections:
           - Overview: A high-level summary.
           - Origins/History: How this came to be.
           - Core Concepts/Mechanisms: How it works or what defines it.
           - Significance/Implications: Why it matters today or in the future.
        5. Length: Approximately 400-500 words.
        6. Use the search tool to verify specific dates, names, and facts.`,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      // Extract sources
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web ? { title: chunk.web.title || "External Source", uri: chunk.web.uri || "#" } : null)
        .filter((s): s is { title: string; uri: string } => s !== null) || [];

      // Deduplicate sources
      const uniqueSources = [...new Map(sources.map(s => [s.uri, s])).values()];

      contentData = {
        content: response.text || "Content generation failed.",
        sources: uniqueSources,
        imageUrl: undefined // AI text gen doesn't give images
      };
    }

  } catch (e) {
    console.error("Content Gen Error:", e);
    contentData.content = "Data stream unavailable.";
  }

  // 3. Resolve Final Image
  // If Wiki provided an image, use it. If not, wait for AI generation.
  let finalImageUrl = contentData.imageUrl;
  if (!finalImageUrl) {
    finalImageUrl = await aiImagePromise;
  }

  return { content: contentData.content, imageUrl: finalImageUrl, sources: contentData.sources };
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Extract base64 audio
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
};

export const createChat = (topic: string, context: string) => {
  return getAI().chats.create({
    model: getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp",
    config: {
      systemInstruction: `You are an expert AI tutor specialized in "${topic}". 
      Context about this topic: "${context}".
      Answer the user's questions deeply, concisely, and in a futuristic, helpful tone. 
      Keep answers under 100 words unless asked for more.`,
    }
  });
};

// =====================================================
// VOICE PROCESSING FUNCTIONS
// For ElevenLabs Challenge - AI Partner Catalyst Hackathon
// =====================================================

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
 * Process a voice command using Gemini AI
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
  const model = getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp";

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
    const response = await getAI().models.generateContent({
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
  const model = getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp";

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
    const response = await getAI().models.generateContent({
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
 * Generate related topics for voice exploration
 * Suggests what the user might want to explore next
 */
export const generateExplorationSuggestions = async (
  currentTopic: string,
  exploredTopics: string[]
): Promise<string[]> => {
  const model = getStoredAPIKeys().geminiModel || "gemini-2.0-flash-exp";

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
    const response = await getAI().models.generateContent({
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