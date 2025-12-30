import React, { useState, useEffect } from 'react';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [text, setText] = useState<string[]>([]);

    useEffect(() => {
        const logs = [
            "INITIALIZING NEURAL INTERFACE...",
            "LOADING KNOWLEDGE GRAPHS...",
            "CONNECTING TO GLOBAL NET...",
            "SECURITY CHECK: BYPASSED",
            "SYSTEM ONLINE."
        ];

        let delay = 0;
        logs.forEach((log, i) => {
            delay += Math.random() * 500 + 200;
            setTimeout(() => {
                setText(prev => [...prev, log]);
                if (i === logs.length - 1) {
                    setTimeout(onComplete, 800);
                }
            }, delay);
        });
    }, [onComplete]);

    return (
        <div className="flex flex-col items-start font-mono text-xs md:text-sm text-cyber-accent uppercase tracking-widest p-8">
            {text.map((t, i) => (
                <div key={i} className="mb-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                    <span>{'>'} {t}</span>
                </div>
            ))}
            <div className="w-2 h-4 bg-cyber-accent animate-pulse mt-2"></div>
        </div>
    );
};
