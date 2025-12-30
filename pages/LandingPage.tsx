import React, { useState } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import { useAPIKeys } from '../contexts/APIKeysContext';
import { useKnowledgeGraph } from '../contexts/KnowledgeGraphContext';
import { IntroSequence } from '../components/IntroSequence';
import { Header } from '../components/Header';

export const LandingPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
    const { keys, isConfigured } = useAPIKeys();
    const { initializeGraph } = useKnowledgeGraph();
    const [inputValue, setInputValue] = useState('');
    const [bootComplete, setBootComplete] = useState(false);

    const handleStart = () => {
        if (!inputValue.trim()) return;
        initializeGraph(inputValue);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 w-full h-full">
            <Header onOpenSettings={onOpenSettings} isConfigured={isConfigured} />

            {!bootComplete ? (
                <div className="w-full max-w-md">
                    <IntroSequence onComplete={() => setBootComplete(true)} />
                </div>
            ) : (
                <div className="max-w-xl w-full animate-in zoom-in-95 duration-700">
                    <div className="bg-cyber-panel/80 border border-cyber-border p-1 backdrop-blur-sm hud-panel">
                        <div className="p-8 border border-cyber-border/50 relative overflow-hidden">
                            {/* Decorative HUD Elements */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-accent"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-accent"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-accent"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-accent"></div>

                            <label className="block text-cyber-accent text-xs font-mono mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal size={14} /> Subject_Input_Protocol
                            </label>

                            <div className="relative group mb-6">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    placeholder="ENTER SUBJECT..."
                                    className="w-full bg-black border-b-2 border-cyber-border text-white py-3 px-2 text-xl focus:outline-none focus:border-cyber-accent font-mono placeholder-gray-800 transition-all uppercase tracking-wider"
                                    autoFocus
                                />
                                <div className="absolute bottom-0 left-0 h-[2px] bg-cyber-accent w-0 group-focus-within:w-full transition-all duration-500 shadow-[0_0_10px_#00f3ff]"></div>
                            </div>

                            <button
                                onClick={handleStart}
                                className="w-full bg-cyber-accent/10 hover:bg-cyber-accent hover:text-black border border-cyber-accent/50 text-cyber-accent py-3 px-6 transition-all duration-300 font-mono text-sm uppercase tracking-widest flex items-center justify-between group hud-btn"
                            >
                                <span>Initialize Dive</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 text-[10px] font-mono text-center uppercase tracking-widest opacity-50">
            // System: {keys.geminiModel || 'Gemini 3.0 Flash'} / Wikipedia API Integrated
                    </p>
                </div>
            )}
        </div>
    );
};
