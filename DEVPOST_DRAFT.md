# Neural Dive

## Project Story

### Inspiration
I wanted to break free from the linear, text-based way we interact with information. The inspiration came from science fiction concepts of "neural interfaces"—systems that let you explore data organically, following threads of curiosity rather than just searching for keywords.

When I saw the **AI Partner Catalyst Hackathon** prompt to combine **ElevenLabs** and **Google Cloud AI**, I realized I could build a real version of this interface. I wanted to create a "second brain" that you can talk to, visualize, and interact with naturally, making the discovery of complex topics as easy as having a conversation.

### What it does
**Neural Dive** is a voice-driven, AI-powered knowledge exploration platform. It replaces standard search results with an interactive, living map of concepts.

*   **🗣️ Voice Control:** You can navigate entirely by voice. Say *"Explore Quantum Physics"* to generate a graph, *"Go deeper"* to expand nodes, or *"Read this"* to hear a summary.
*   **🧠 Dynamic Mind Mapping:** Powered by **Google Gemini AI models**, the app generates knowledge graphs in real-time. You can switch between a Tree View for structure or a Network Matrix to see connections.
*   **⚗️ Concept Synthesis:** Select any two nodes and hit "Fuse" (or say *"Combine"*). The AI analyzes how they intersect and creates a new, bridge concept between them (e.g., fusing "Biology" and "Technology" might sprout "Bioinformatics").
*   **🔊 Premium Voice Output:** I integrated **ElevenLabs** to give the AI a high-quality human voice, offering multiple personas like "Neural" (professional) or "Narrator" (storyteller).
*   **🔒 Privacy-First:** The app follows a "Bring Your Own Key" architecture. API keys are stored locally in your browser and never sent to my servers, ensuring your data and usage remain private.

### How I built it
I built Neural Dive as a modern, high-performance web application:

*   **Frontend:** I used **React 19** and **TypeScript** for a robust, type-safe codebase, with **Vite** for lightning-fast capability.
*   **Visualization:** I implemented **D3.js** to render the complex, interactive force-directed graphs and trees.
*   **AI Brain:** **Google Gemini 2.5 Flash** acts as the core reasoning engine. It parses natural language voice commands, generates the structured graph data, and synthesizes new concepts.
*   **Voice:** I combined the browser's **Web Speech API** for instant wake-word detection with **ElevenLabs' API** for streaming, high-fidelity response audio.
*   **Styling:** **Tailwind CSS** allowed me to rapidly build the custom "Cyberpunk HUD" aesthetic with neon glows and glassmorphism.
*   **Deployment:** The app is hosted on **Google Firebase**, taking advantage of their global CDN for low latency.

### Challenges I ran into
*   **Structured Data Generation:** Getting an LLM to consistently output valid JSON for graph structures while maintaining creative, high-quality content was tricky. I spent a lot of time refining the system prompts for Gemini to ensure stability.
*   **Voice Latency:** I wanted the conversation to feel real-time. Optimizing the chain from *Speech-to-Text* → *Gemini Processing* → *ElevenLabs TTS* required careful handling of asynchronous events to minimize the delay before the AI spoke back.
*   **D3 + React Integration:** Managing D3's imperative DOM manipulation alongside React's declarative state model is always a challenge, especially when nodes need to be dynamically added and removed without refreshing the canvas.

### Accomplishments that I'm proud of
*   **The "Fuse" Mechanism:** Seeing the AI successfully find meaningful connections between two completely unrelated concepts (like "Coffee" and "Blockchain") feels like magic every time.
*   **The Vibe:** I didn't just build a tool; I built an experience. The animations, the sound effects, and the visual style work together to make you feel like you're using software from the future.
*   **Seamless Voice Loop:** Achieving a hands-free flow where you can explore a complex topic for 10 minutes without touching the keyboard.

### What I learned
*   **Multi-Modal AI:** I learned how to effectively chain different AI models (Gemini for logic/vision, ElevenLabs for voice) to create a product that is greater than the sum of its parts.
*   **Client-Side AI:** I discovered that powerful AI apps don't always need heavy backends. By handling API calls directly from the client, I reduced infrastructure costs and improved user privacy.

### What's next for Neural Dive
*   **Persistent Memory:** Storing user graphs in Firestore so you can return to your "mind palace" later.
*   **Multi-Language Support:** Utilizing ElevenLabs' multilingual models to let users explore content in any language.
*   **VR Experience:** Moving the 2D/3D graph visualization into a fully immersive WebXR environment.

---
### Built with (Keywords)
React, TypeScript, Vite, Tailwind CSS, Google Cloud, Gemini, Firebase, ElevenLabs, D3.js
