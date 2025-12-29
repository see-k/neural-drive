import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Volume2, Radio, Waves, X, Sparkles, Brain, ChevronUp } from 'lucide-react';
import {
    createVoiceRecognition,
    VoiceCommand,
    VoiceRecognitionController,
    generateElevenLabsSpeech,
    decodeElevenLabsAudio,
    playFeedbackSound,
    VOICE_PROFILES,
    VoiceProfile
} from '../services/elevenLabsService';
import {
    processVoiceCommand,
    generateVoiceSummary,
    generateExplorationSuggestions
} from '../services/vertexAIService';
import { generateSpeech } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';

interface VoiceInterfaceProps {
    currentTopic?: string;
    currentContent?: string;
    onExplore: (topic: string) => void;
    onExpand: () => void;
    onRead: () => void;
    onCombine: () => void;
    onBack: () => void;
    isEnabled: boolean;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
    currentTopic,
    currentContent,
    onExplore,
    onExpand,
    onRead,
    onCombine,
    onBack,
    isEnabled
}) => {
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [transcript, setTranscript] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>('neural');

    const recognitionRef = useRef<VoiceRecognitionController | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Initialize voice recognition
    useEffect(() => {
        if (!isEnabled) return;

        const handleResult = async (command: VoiceCommand) => {
            setTranscript(command.rawTranscript);
            setStatus('processing');

            try {
                // Use Vertex AI to process the command
                const processed = await processVoiceCommand(command.rawTranscript, currentTopic);
                setResponse(processed.response);

                // Execute the appropriate action
                switch (processed.intent) {
                    case 'explore':
                        if (processed.topic) {
                            onExplore(processed.topic);
                        }
                        break;
                    case 'expand':
                        onExpand();
                        break;
                    case 'read':
                        onRead();
                        break;
                    case 'combine':
                        onCombine();
                        break;
                    case 'navigate':
                        onBack();
                        break;
                }

                // Speak the response if needed
                if (processed.shouldSpeak) {
                    await speakResponse(processed.response);
                }

                playFeedbackSound('success');
            } catch (e) {
                console.error('Command processing error:', e);
                setError('Failed to process command');
                playFeedbackSound('error');
            }

            setStatus('idle');
        };

        const handleListeningChange = (isListening: boolean) => {
            if (isListening) {
                setStatus('listening');
                setError(null);
                setTranscript('');
            } else if (status === 'listening') {
                setStatus('idle');
            }
        };

        const handleError = (errorMsg: string) => {
            setError(errorMsg);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        };

        recognitionRef.current = createVoiceRecognition(
            handleResult,
            handleListeningChange,
            handleError
        );

        return () => {
            recognitionRef.current?.stop();
        };
    }, [isEnabled, currentTopic, onExplore, onExpand, onRead, onCombine, onBack]);

    // Load exploration suggestions when topic changes
    useEffect(() => {
        if (currentTopic && isExpanded) {
            generateExplorationSuggestions(currentTopic, [])
                .then(setSuggestions)
                .catch(() => setSuggestions([]));
        }
    }, [currentTopic, isExpanded]);

    // Initialize audio context on first interaction
    const initAudioContext = useCallback(async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
    }, []);

    // Speak response using ElevenLabs (with Gemini fallback)
    const speakResponse = async (text: string) => {
        setStatus('speaking');
        await initAudioContext();

        try {
            // Try ElevenLabs first
            const elevenLabsAudio = await generateElevenLabsSpeech(text, { voiceProfile });

            if (elevenLabsAudio && audioContextRef.current) {
                const buffer = await decodeElevenLabsAudio(elevenLabsAudio, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.onended = () => setStatus('idle');
                source.start(0);
                sourceNodeRef.current = source;
                return;
            }

            // Fallback to Gemini TTS
            const geminiAudio = await generateSpeech(text);
            if (geminiAudio && audioContextRef.current) {
                const buffer = await decodeAudioData(geminiAudio, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.onended = () => setStatus('idle');
                source.start(0);
                sourceNodeRef.current = source;
            } else {
                setStatus('idle');
            }
        } catch (e) {
            console.error('Speech synthesis error:', e);
            setStatus('idle');
        }
    };

    // Stop current audio playback
    const stopSpeaking = useCallback(() => {
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) { }
            sourceNodeRef.current = null;
        }
        setStatus('idle');
    }, []);

    // Start listening for voice commands
    const startListening = useCallback(async () => {
        await initAudioContext();
        playFeedbackSound('start');
        recognitionRef.current?.start();
    }, [initAudioContext]);

    // Stop listening
    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    // Handle quick suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        playFeedbackSound('success');
        onExplore(suggestion);
    };

    if (!isEnabled) return null;

    const isActive = status !== 'idle';

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${isExpanded ? 'w-[500px]' : 'w-auto'}`}>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="mb-4 bg-cyber-panel/95 border border-cyber-border backdrop-blur-xl rounded-sm overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-cyber-border/30">
                        <div className="flex items-center gap-2">
                            <Brain className="text-cyber-accent" size={16} />
                            <span className="text-xs font-mono text-cyber-accent uppercase tracking-widest">Voice Neural Interface</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Transcript Display */}
                    <div className="p-4 min-h-[100px] flex flex-col justify-center items-center relative">

                        {/* Ambient Animation */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-cyber-accent/5 transition-all duration-1000 ${status === 'listening' ? 'scale-[3] opacity-100' : 'scale-0 opacity-0'}`} />
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500/10 transition-all duration-700 delay-100 ${status === 'listening' ? 'scale-[2.5] opacity-100' : 'scale-0 opacity-0'}`} />
                        </div>

                        <div className="relative z-10 text-center">
                            {status === 'idle' && !transcript && (
                                <p className="text-gray-500 text-sm font-mono">
                                    {currentTopic ? `Exploring: ${currentTopic}` : 'Say "Explore [topic]" to begin'}
                                </p>
                            )}

                            {status === 'listening' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-cyber-accent rounded-full animate-ping" />
                                    <p className="text-cyber-accent text-lg font-mono animate-pulse">Listening...</p>
                                </div>
                            )}

                            {transcript && status !== 'listening' && (
                                <div className="space-y-2">
                                    <p className="text-white text-lg font-mono">"{transcript}"</p>
                                    {response && (
                                        <p className="text-gray-400 text-sm">{response}</p>
                                    )}
                                </div>
                            )}

                            {status === 'processing' && (
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Loader2 className="animate-spin" size={18} />
                                    <span className="font-mono text-sm">Processing...</span>
                                </div>
                            )}

                            {status === 'speaking' && (
                                <div className="flex items-center gap-2 text-cyber-accent">
                                    <Volume2 className="animate-pulse" size={18} />
                                    <span className="font-mono text-sm">Speaking...</span>
                                </div>
                            )}

                            {error && (
                                <p className="text-cyber-danger text-sm font-mono">{error}</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="px-4 pb-4">
                            <p className="text-[10px] font-mono text-gray-500 uppercase mb-2 flex items-center gap-1">
                                <Sparkles size={10} /> Suggested Topics
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="text-xs font-mono bg-black border border-cyber-border hover:border-cyber-accent text-gray-400 hover:text-cyber-accent px-3 py-1.5 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voice Commands Help */}
                    <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-black/40 border border-cyber-border/50 p-2">
                            <span className="text-cyber-accent">"Explore [topic]"</span>
                            <span className="text-gray-600 ml-2">- Start new topic</span>
                        </div>
                        <div className="bg-black/40 border border-cyber-border/50 p-2">
                            <span className="text-cyber-accent">"Go deeper"</span>
                            <span className="text-gray-600 ml-2">- Expand topic</span>
                        </div>
                        <div className="bg-black/40 border border-cyber-border/50 p-2">
                            <span className="text-cyber-accent">"Read this"</span>
                            <span className="text-gray-600 ml-2">- Voice briefing</span>
                        </div>
                        <div className="bg-black/40 border border-cyber-border/50 p-2">
                            <span className="text-cyber-accent">"Combine"</span>
                            <span className="text-gray-600 ml-2">- Merge concepts</span>
                        </div>
                    </div>

                    {/* Voice Profile Selector */}
                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-mono text-gray-500 uppercase mb-2">Voice Profile</p>
                        <div className="flex gap-2">
                            {(Object.keys(VOICE_PROFILES) as VoiceProfile[]).map((profile) => (
                                <button
                                    key={profile}
                                    onClick={() => setVoiceProfile(profile)}
                                    className={`text-[10px] font-mono px-3 py-1 border transition-all uppercase ${voiceProfile === profile
                                            ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent'
                                            : 'border-cyber-border text-gray-500 hover:text-white hover:border-white'
                                        }`}
                                >
                                    {profile}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Voice Button */}
            <div className="flex items-center justify-center gap-4">

                {/* Expand Toggle */}
                {!isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="p-2 bg-cyber-panel/80 border border-cyber-border text-gray-500 hover:text-white hover:border-white transition-all backdrop-blur-md"
                    >
                        <ChevronUp size={16} />
                    </button>
                )}

                {/* Primary Voice Button */}
                <button
                    onClick={status === 'speaking' ? stopSpeaking : (status === 'listening' ? stopListening : startListening)}
                    disabled={status === 'processing'}
                    className={`
            relative group p-6 rounded-full transition-all duration-300 shadow-2xl
            ${status === 'listening'
                            ? 'bg-cyber-accent text-black scale-110 shadow-[0_0_40px_rgba(0,243,255,0.5)]'
                            : status === 'speaking'
                                ? 'bg-purple-500 text-white scale-105 shadow-[0_0_30px_rgba(112,0,255,0.5)]'
                                : status === 'processing'
                                    ? 'bg-cyber-panel border-2 border-purple-500/50 text-purple-400'
                                    : 'bg-cyber-panel/90 border-2 border-cyber-border hover:border-cyber-accent text-cyber-accent hover:shadow-[0_0_30px_rgba(0,243,255,0.3)]'
                        }
            backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed
          `}
                >
                    {/* Pulsing rings when listening */}
                    {status === 'listening' && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-cyber-accent animate-ping opacity-50" />
                            <div className="absolute inset-[-8px] rounded-full border border-cyber-accent/30 animate-pulse" />
                        </>
                    )}

                    {/* Icon */}
                    {status === 'processing' ? (
                        <Loader2 size={28} className="animate-spin" />
                    ) : status === 'speaking' ? (
                        <Volume2 size={28} className="animate-pulse" />
                    ) : status === 'listening' ? (
                        <Waves size={28} className="animate-pulse" />
                    ) : (
                        <Mic size={28} />
                    )}
                </button>

                {/* Status indicator */}
                {!isExpanded && (
                    <div className="bg-cyber-panel/80 border border-cyber-border backdrop-blur-md px-4 py-2 text-xs font-mono">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status === 'idle' ? 'bg-gray-500' :
                                status === 'listening' ? 'bg-cyber-accent animate-pulse' :
                                    status === 'speaking' ? 'bg-purple-500 animate-pulse' :
                                        status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                            'bg-cyber-danger'
                            }`} />
                        <span className="text-gray-400 uppercase tracking-wider">
                            {status === 'idle' ? 'Voice Ready' : status.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceInterface;
