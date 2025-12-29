/**
 * ElevenLabs Voice Service
 * Provides text-to-speech and conversational AI capabilities
 * for the AI Partner Catalyst Hackathon - ElevenLabs Challenge
 */

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Custom voice ID from environment (takes priority)
const CUSTOM_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// Voice IDs for different personas - these are ElevenLabs preset voices
// If a custom voice ID is provided, it becomes the 'neural' (default) voice
export const VOICE_PROFILES = {
  neural: CUSTOM_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Custom or Adam - Deep, professional
  assistant: 'EXAVITQu4vr4xnSDxMaL', // Bella - Warm, friendly
  narrator: '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear, articulate
  cyber: 'VR6AewLTigWG4xSOukaG', // Arnold - Authoritative
  custom: CUSTOM_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Explicit custom option
} as const;

export type VoiceProfile = keyof typeof VOICE_PROFILES;

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface TTSOptions {
  voiceProfile?: VoiceProfile;
  voiceSettings?: Partial<VoiceSettings>;
  modelId?: string;
}

/**
 * Generate speech from text using ElevenLabs TTS
 * Returns base64 encoded audio data
 */
export const generateElevenLabsSpeech = async (
  text: string,
  options: TTSOptions = {}
): Promise<string | undefined> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('ElevenLabs API key not configured, falling back to Gemini TTS');
    return undefined;
  }

  const {
    voiceProfile = 'neural',
    voiceSettings = {},
    modelId = 'eleven_multilingual_v2'
  } = options;

  const voiceId = VOICE_PROFILES[voiceProfile];

  const defaultSettings: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
    ...voiceSettings
  };

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text.substring(0, 5000), // ElevenLabs limit
        model_id: modelId,
        voice_settings: defaultSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS Error:', response.status, errorText);
      return undefined;
    }

    // Convert response to base64
    const audioBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return base64;
  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    return undefined;
  }
};

/**
 * Decode ElevenLabs audio (MP3) for playback
 */
export const decodeElevenLabsAudio = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  // Convert base64 to array buffer
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode MP3 audio
  return await audioContext.decodeAudioData(bytes.buffer);
};

/**
 * Voice command recognition using Web Speech API
 * Returns parsed voice command
 */
export interface VoiceCommand {
  type: 'explore' | 'expand' | 'read' | 'combine' | 'back' | 'help' | 'unknown';
  target?: string;
  rawTranscript: string;
  confidence: number;
}

const COMMAND_PATTERNS = {
  explore: /^(explore|search|find|look up|investigate|dive into)\s+(.+)/i,
  expand: /^(expand|branch|go deeper|more|show more|drill down)/i,
  read: /^(read|speak|tell me|say|narrate|brief me)/i,
  combine: /^(combine|merge|fuse|synthesize|connect)/i,
  back: /^(back|go back|return|previous|undo)/i,
  help: /^(help|commands|what can you do|options)/i,
};

export const parseVoiceCommand = (transcript: string): VoiceCommand => {
  const cleaned = transcript.trim().toLowerCase();

  // Check each pattern
  for (const [type, pattern] of Object.entries(COMMAND_PATTERNS)) {
    const match = cleaned.match(pattern);
    if (match) {
      return {
        type: type as VoiceCommand['type'],
        target: match[2]?.trim(), // Capture group for target (e.g., topic name)
        rawTranscript: transcript,
        confidence: 1.0,
      };
    }
  }

  // If no command matched but there's text, treat as explore command
  if (cleaned.length > 2) {
    return {
      type: 'explore',
      target: cleaned,
      rawTranscript: transcript,
      confidence: 0.7,
    };
  }

  return {
    type: 'unknown',
    rawTranscript: transcript,
    confidence: 0,
  };
};

/**
 * Initialize Web Speech Recognition
 * Returns a controller object for the recognition session
 */
export interface VoiceRecognitionController {
  start: () => void;
  stop: () => void;
  isListening: () => boolean;
}

export const createVoiceRecognition = (
  onResult: (command: VoiceCommand) => void,
  onListeningChange: (isListening: boolean) => void,
  onError: (error: string) => void
): VoiceRecognitionController | null => {
  // Check for browser support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let listening = false;

  recognition.onstart = () => {
    listening = true;
    onListeningChange(true);
  };

  recognition.onend = () => {
    listening = false;
    onListeningChange(false);
  };

  recognition.onerror = (event: any) => {
    listening = false;
    onListeningChange(false);

    if (event.error === 'no-speech') {
      onError('No speech detected. Try again.');
    } else if (event.error === 'not-allowed') {
      onError('Microphone access denied. Please enable microphone permissions.');
    } else {
      onError(`Voice recognition error: ${event.error}`);
    }
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;

    const command = parseVoiceCommand(transcript);
    command.confidence = confidence;
    onResult(command);
  };

  return {
    start: () => {
      if (!listening) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Recognition start error:', e);
        }
      }
    },
    stop: () => {
      if (listening) {
        recognition.stop();
      }
    },
    isListening: () => listening,
  };
};

/**
 * Play audio feedback sounds
 */
export const playFeedbackSound = (type: 'start' | 'success' | 'error') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const frequencies = {
    start: [440, 550], // Rising tone
    success: [550, 660, 880], // Happy chirp
    error: [440, 330], // Falling tone
  };

  const freq = frequencies[type];
  let time = audioContext.currentTime;

  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.1, time);

  freq.forEach((f, i) => {
    oscillator.frequency.setValueAtTime(f, time + i * 0.1);
  });

  gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

  oscillator.start(time);
  oscillator.stop(time + 0.3);
};
