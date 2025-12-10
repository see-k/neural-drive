import React from 'react';
import { X, Cpu, Image as ImageIcon, Globe, ExternalLink, Database } from 'lucide-react';
import { KnowledgeNode } from '../types';

interface ContentModalProps {
  node: KnowledgeNode;
  onClose: () => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({ node, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" onClick={onClose} />
      
      {/* Main Container - Removed solid bg-cyber-black to allow glass effect in children */}
      <div className="relative z-10 w-full max-w-6xl h-full md:h-[90vh] border border-cyber-border shadow-[0_0_100px_rgba(0,243,255,0.1)] flex flex-col md:flex-row overflow-hidden hud-panel animate-in zoom-in-95 duration-300">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-cyber-border flex justify-between items-center bg-cyber-dark">
          <h2 className="text-cyber-accent font-mono font-bold truncate tracking-widest">{node.name.toUpperCase()}</h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        {/* Left Col: Visuals & Meta - Glass Effect applied here */}
        <div className="w-full md:w-[350px] bg-black/40 backdrop-blur-2xl border-r border-cyber-border relative flex flex-col shrink-0">
           {/* Image */}
           <div className="h-64 md:h-80 w-full relative overflow-hidden group bg-black/50 border-b border-cyber-border">
              {node.imageUrl ? (
                <>
                  <img src={node.imageUrl} alt={node.name} className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute top-2 left-2 bg-black/80 text-cyber-accent text-[10px] font-mono px-2 py-1 border border-cyber-accent/30">
                     VISUAL_FEED
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-cyber-border">
                  <ImageIcon size={48} className="opacity-20 mb-2" />
                  <span className="text-[10px] font-mono uppercase opacity-50">NO SIGNAL</span>
                </div>
              )}
           </div>

           {/* Meta Data Panel - Glass/Transparent instead of Noise */}
           <div className="p-6 flex-1 bg-gradient-to-b from-white/5 to-transparent relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10"></div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-white font-mono leading-none tracking-tighter mb-6 break-words drop-shadow-lg">
                {node.name.toUpperCase()}
              </h1>
              
              <div className="space-y-4">
                 <div className="border-l-2 border-cyber-accent pl-4">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Classification</span>
                    <span className="text-sm text-cyber-accent font-mono">KNOWLEDGE_NODE_TYPE_A</span>
                 </div>
                 <div className="border-l-2 border-gray-700 pl-4">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Depth Level</span>
                    <span className="text-sm text-gray-300 font-mono">LAYER {node.children ? 1 : 0}</span>
                 </div>
                 <div className="border-l-2 border-gray-700 pl-4">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Status</span>
                    <span className="text-sm text-cyber-success font-mono flex items-center gap-2">
                       <span className="w-2 h-2 bg-cyber-success rounded-full animate-pulse"></span> ONLINE
                    </span>
                 </div>
              </div>
           </div>

           {/* Tech Decoration */}
           <div className="p-4 border-t border-cyber-border/30 opacity-50">
              <div className="flex gap-1 mb-1">
                 {Array.from({length: 12}).map((_, i) => <div key={i} className="h-1 w-full bg-cyber-accent/30"></div>)}
              </div>
              <p className="text-[8px] font-mono text-center text-gray-500">SYSTEM ID: {node.id.split('-')[0]}</p>
           </div>
        </div>

        {/* Right Col: Content - Solid background for readability */}
        <div className="flex-1 flex flex-col bg-cyber-black relative overflow-hidden">
          {/* Top Bar */}
          <div className="h-12 border-b border-cyber-border flex items-center justify-between px-6 bg-cyber-dark/50">
             <div className="flex items-center gap-2 text-cyber-accent text-xs font-mono uppercase tracking-widest">
                <Database size={14} /> Full_Analysis_Protocol
             </div>
             <button onClick={onClose} className="hidden md:flex text-gray-500 hover:text-cyber-danger transition-colors items-center gap-2 text-xs font-mono uppercase hover:bg-cyber-danger/10 px-3 py-1 border border-transparent hover:border-cyber-danger/30">
                [ Close Terminal ] <X size={14} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
             {/* Content Background Watermark */}
             <div className="absolute top-20 right-20 opacity-[0.02] text-9xl font-mono font-bold text-white pointer-events-none select-none">
                DATA
             </div>

             <div className="max-w-3xl">
                {node.detailedContent ? (
                  <div 
                    className="generated-content"
                    dangerouslySetInnerHTML={{ __html: node.detailedContent }}
                  />
                ) : (
                  <div className="space-y-6 opacity-30">
                    <div className="h-4 bg-gray-800 w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-800 w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-800 w-5/6 animate-pulse"></div>
                    <div className="h-40 bg-gray-900 w-full border border-gray-800 animate-pulse mt-8"></div>
                  </div>
                )}
             </div>

             {/* Footer References */}
             {node.sources && node.sources.length > 0 && (
                <div className="mt-16 pt-8 border-t border-cyber-border/50">
                   <h3 className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Globe size={14} /> Confirmed Uplinks
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {node.sources.map((source, idx) => (
                       <a 
                         key={idx} 
                         href={source.uri} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center justify-between text-xs text-cyber-accent bg-cyber-panel border border-cyber-border p-3 hover:border-cyber-accent hover:bg-cyber-accent/5 transition-all group"
                       >
                         <span className="truncate font-mono opacity-80 group-hover:opacity-100">{source.title}</span>
                         <ExternalLink size={10} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                       </a>
                     ))}
                   </div>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};