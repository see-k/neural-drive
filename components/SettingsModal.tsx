import React, { useState, useEffect } from 'react';
import { X, Key, Save, ExternalLink, Shield } from 'lucide-react';
import { useAPIKeys } from '../contexts/APIKeysContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { keys, setKeys, isConfigured } = useAPIKeys();
    const [localKeys, setLocalKeys] = useState(keys);
    const [showSensitivityWarning, setShowSensitivityWarning] = useState(false);

    // Sync local state when keys change in context
    useEffect(() => {
        setLocalKeys(keys);
    }, [keys]);

    if (!isOpen) return null;

    const handleSave = () => {
        setKeys(localKeys);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Window */}
            <div className="relative w-full max-w-lg bg-cyber-panel border border-cyber-border rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyber-accent/10 rounded-lg border border-cyber-accent/20">
                            <Key className="text-cyber-accent" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Neural Link Configuration</h2>
                            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Secure Connection Setup</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex gap-3">
                        <Shield className="text-blue-400 shrink-0" size={20} />
                        <div className="text-xs text-blue-200">
                            <p className="font-bold mb-1">Privacy First Architecture</p>
                            <p>Your API keys are stored locally in your browser and never sent to our servers. They connect directly to Google and ElevenLabs APIs.</p>
                        </div>
                    </div>

                    {/* Gemini Config */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyber-accent uppercase tracking-wider flex items-center justify-between">
                            <span>Google Gemini API Key</span>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                Get Key <ExternalLink size={10} />
                            </a>
                        </label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={localKeys.geminiApiKey}
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                                placeholder="AIza..."
                                className="w-full bg-black/50 border border-cyber-border rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all font-mono"
                            />
                            <div className="absolute inset-0 border border-cyber-accent/0 group-hover:border-cyber-accent/30 rounded pointer-events-none transition-all" />
                        </div>
                        <p className="text-[10px] text-gray-500">Required for brain functions (Topics, Summaries, Voice Intent).</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyber-accent uppercase tracking-wider">
                            Gemini Model
                        </label>
                        <select
                            value={localKeys.geminiModel || 'gemini-2.0-flash-exp'}
                            onChange={(e) => setLocalKeys(prev => ({ ...prev, geminiModel: e.target.value }))}
                            className="w-full bg-black/50 border border-cyber-border rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all font-mono appearance-none"
                        >
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash Preview</option>
                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        </select>
                        <p className="text-[10px] text-gray-500">Select the cognitive model for the application.</p>
                    </div>

                    {/* ElevenLabs Config */}
                    <div className="space-y-4 pt-4 border-t border-cyber-border/30">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-purple-400 uppercase tracking-wider flex items-center justify-between">
                                <span>ElevenLabs API Key (Optional)</span>
                                <a
                                    href="https://elevenlabs.io/app/settings/api-keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    Get Key <ExternalLink size={10} />
                                </a>
                            </label>
                            <input
                                type="password"
                                value={localKeys.elevenLabsApiKey}
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, elevenLabsApiKey: e.target.value }))}
                                placeholder="sk_..."
                                className="w-full bg-black/50 border border-cyber-border rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                                Voice ID (Optional)
                            </label>
                            <input
                                type="text"
                                value={localKeys.elevenLabsVoiceId}
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, elevenLabsVoiceId: e.target.value }))}
                                placeholder="Default: Rachel"
                                className="w-full bg-black/50 border border-cyber-border rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all font-mono"
                            />
                            <p className="text-[10px] text-gray-500">Required for high-quality Neural Voice. Falls back to standard voices if missing.</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-black/40 border-t border-cyber-border flex justify-between items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear your credentials? This will disconnect you from AI services.")) {
                                setKeys({ geminiApiKey: '', geminiModel: 'gemini-3-flash-preview', elevenLabsApiKey: '', elevenLabsVoiceId: '' });
                                onClose();
                            }
                        }}
                        className="px-4 py-2 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30 rounded"
                    >
                        DISCONNECT / CLEAR KEYS
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!localKeys.geminiApiKey}
                            className={`
              flex items-center gap-2 px-6 py-2 rounded text-xs font-bold font-mono uppercase tracking-wider transition-all
              ${localKeys.geminiApiKey
                                    ? 'bg-cyber-accent text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
            `}
                        >
                            <Save size={14} />
                            Save Configuration
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
