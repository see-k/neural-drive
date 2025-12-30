import React from 'react';

export const BackgroundGrid = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-transparent to-cyber-black z-10"></div>
        {/* Moving Grid */}
        <div
            className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.3) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                transform: 'perspective(500px) rotateX(60deg) translateY(0)',
                transformOrigin: 'top center',
                animation: 'gridMove 20s linear infinite',
                height: '200%'
            }}
        ></div>
        <style>{`
      @keyframes gridMove {
        0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
        100% { transform: perspective(500px) rotateX(60deg) translateY(-50px); }
      }
    `}</style>
    </div>
);
