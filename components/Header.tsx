import React from 'react';
import { BrainCircuit, Settings } from 'lucide-react';

interface HeaderProps {
    controls?: React.ReactNode;
    onOpenSettings: () => void;
    isConfigured: boolean; // Determine button style
    className?: string; // For positioning if needed
}

export const Header: React.FC<HeaderProps> = ({ controls, onOpenSettings, isConfigured, className }) => {
    return (
        <div className={`absolute top-0 left-0 right-0 p-6 z-50 pointer-events-none flex flex-col md:flex-row justify-between items-start gap-8 w-full ${className || ''}`}>
            <div className="pointer-events-auto flex flex-col">
                <h1 className="text-3xl font-bold font-mono text-white flex items-center gap-3 tracking-tighter">
                    <BrainCircuit className="w-8 h-8 text-cyber-accent animate-pulse-fast" />
                    <span className="glow-text">NEURAL_DIVE</span>
                    <span className="text-[10px] bg-cyber-accent text-black px-1 rounded-sm font-bold mt-1">v3.0</span>
                </h1>
                <div className="h-[1px] w-full bg-gradient-to-r from-cyber-accent to-transparent my-2"></div>
            </div>

            <div className="flex items-stretch gap-4 transition-all duration-500 ease-in-out">
                {controls && (
                    <div className="pointer-events-auto flex items-center gap-4 bg-black/80 border border-cyber-border p-2 backdrop-blur-md rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        {controls}
                    </div>
                )}

                {/* Settings Button */}
                <div className={`pointer-events-auto flex items-center justify-center bg-black/80 border p-2 backdrop-blur-md rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] ${!isConfigured
                    ? 'border-red-500 bg-red-500/10 animate-pulse'
                    : 'border-cyber-border'
                    }`}>
                    <button
                        onClick={onOpenSettings}
                        className="text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                        title="Configuration"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
