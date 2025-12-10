import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { SubTopicResponse, NodeContentResponse } from "../types";
import { fetchWikipediaData } from "./wikipediaService";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const model = "gemini-2.5-flash"; 

  const contextPrompt = parentContext 
    ? `The parent topic is "${parentContext}".` 
    : "This is a root topic.";

  const prompt = `
    ${contextPrompt}
    Analyze the topic "${topic}".
    Break this down into 3 to 5 distinct, fundamental sub-branches or deeper concepts that one must understand to master "${topic}".
    Focus on structural knowledge or fascinating specific niches.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
  // Parallel execution: Text content and Image generation
  
  const contentPromise = (async () => {
    try {
      // 1. Try fetching from Wikipedia first
      const wikiData = await fetchWikipediaData(topic);
      
      if (wikiData) {
        return {
          content: wikiData.content,
          sources: [{ title: `Wikipedia: ${wikiData.title}`, uri: wikiData.url }]
        };
      }

      // 2. Fallback to Gemini if no Wiki page found
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
      
      // Extract sources from grounding metadata
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web ? { title: chunk.web.title || "External Source", uri: chunk.web.uri || "#" } : null)
        .filter((s): s is { title: string; uri: string } => s !== null) || [];

      // Deduplicate sources by URI
      const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

      return { content: response.text || "Content generation failed.", sources: uniqueSources };

    } catch (e) {
      console.error("Content Gen Error:", e);
      return { content: "Data stream unavailable.", sources: [] };
    }
  })();

  const imagePromise = (async () => {
    try {
      const response = await ai.models.generateContent({
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

  const [textData, imageUrl] = await Promise.all([contentPromise, imagePromise]);

  return { content: textData.content, imageUrl, sources: textData.sources };
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
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
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are an expert AI tutor specialized in "${topic}". 
      Context about this topic: "${context}".
      Answer the user's questions deeply, concisely, and in a futuristic, helpful tone. 
      Keep answers under 100 words unless asked for more.`,
    }
  });
};