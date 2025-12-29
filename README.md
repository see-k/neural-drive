<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🧠 Neural Dive

> **AI Partner Catalyst Hackathon - ElevenLabs Challenge Entry**
>
> A voice-driven, AI-powered knowledge exploration platform that combines interactive mind mapping with natural voice interaction.

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Vertex%20AI-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/vertex-ai)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice%20AI-000000?style=for-the-badge)](https://elevenlabs.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## 🎯 Hackathon Challenge

This project was built for the **AI Partner Catalyst: Accelerate Innovation** hackathon, specifically for the **ElevenLabs Challenge**:

> *"Use ElevenLabs and Google Cloud AI to make your app conversational, intelligent, and voice-driven. Combine ElevenLabs Agents with Google Cloud Vertex AI or Gemini to give your app a natural, human voice and personality — enabling users to interact entirely through speech."*

## ✨ Features

### 🗣️ Voice-First Experience
- **Voice Commands**: Explore topics, navigate, and control the app entirely through speech
- **Natural Voice Responses**: ElevenLabs-powered text-to-speech with multiple voice profiles
- **Real-time Transcription**: Web Speech API integration for instant voice recognition

### 🧠 AI-Powered Knowledge Exploration
- **Dynamic Mind Mapping**: Interactive D3.js visualization of knowledge graphs
- **Concept Synthesis**: Merge two topics to discover their intersection
- **Smart Suggestions**: AI-generated exploration paths based on your interests

### 🎨 Cyberpunk Aesthetic
- **Immersive UI**: HUD-style interfaces with neon accents and smooth animations
- **Multiple Views**: Switch between tree and network graph visualizations
- **Boot Sequence**: Atmospheric startup animation

## 🛠️ Technology Stack

### Google Cloud Integration
- **Gemini 2.5 Flash**: Core AI model for content generation and reasoning
- **Gemini Image Generation**: AI-generated visual representations
- **Google Search Grounding**: Fact-verified content with source citations
- **Vertex AI Ready**: Architecture supports Vertex AI deployment

### ElevenLabs Integration
- **Text-to-Speech**: Natural voice synthesis with multiple voice profiles
- **Voice Profiles**: Neural, Assistant, Narrator, and Cyber personas
- **Multilingual Support**: ElevenLabs Multilingual v2 model

### Frontend
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety throughout
- **D3.js**: Interactive data visualizations
- **Tailwind CSS**: Utility-first styling
- **Vite**: Lightning-fast development and builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Gemini API key ([Get one here](https://ai.google.dev/))
- An ElevenLabs API key ([Get one here](https://elevenlabs.io/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/neural-drive.git
cd neural-drive

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Environment Variables

```env
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Optional: ElevenLabs API Key (enhances voice quality)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## 🎮 Voice Commands

| Command | Action |
|---------|--------|
| "Explore [topic]" | Start exploring a new topic |
| "Go deeper" | Expand current topic into subtopics |
| "Read this" | Have the content spoken aloud |
| "Combine" | Enter synthesis mode to merge concepts |
| "Go back" | Navigate to parent topic |

## 📖 How It Works

1. **Start**: Say "Explore quantum physics" or type a topic
2. **Navigate**: Click nodes or use voice to explore branches
3. **Learn**: Read AI-generated content with source citations
4. **Listen**: Toggle voice mode for hands-free learning
5. **Synthesize**: Combine topics to discover new concepts

## 🏗️ Project Structure

```
neural-drive/
├── App.tsx                 # Main application component
├── components/
│   ├── MindMap.tsx        # D3.js tree visualization
│   ├── NetworkGraph.tsx   # D3.js force-directed graph
│   ├── Sidebar.tsx        # Node details panel
│   ├── VoiceInterface.tsx # Voice control interface
│   ├── ChatInterface.tsx  # AI chat component
│   └── ContentModal.tsx   # Full content modal
├── services/
│   ├── geminiService.ts   # Gemini AI integration
│   ├── vertexAIService.ts # Vertex AI voice processing
│   ├── elevenLabsService.ts # ElevenLabs TTS
│   └── wikipediaService.ts # Wikipedia fallback
├── utils/
│   └── audioUtils.ts      # Audio processing utilities
└── types.ts               # TypeScript definitions
```

## 🎥 Demo

[Watch Demo Video](https://youtube.com/your-demo-link)

## 🌐 Live Demo

[Try Neural Dive](https://your-deployed-url.com)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud** for Gemini AI and Vertex AI
- **ElevenLabs** for natural voice synthesis
- **Devpost** for hosting the hackathon

---

<div align="center">

**Built with 🧠 for the AI Partner Catalyst Hackathon**

[View on Devpost](https://ai-partner-catalyst.devpost.com/)

</div>
