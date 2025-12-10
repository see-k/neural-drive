import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Maximize2, Play, Square, MessageSquare, FileText, Mic, Globe, Cpu, Wifi, Activity, ShieldCheck, ChevronRight, Zap, Layers } from 'lucide-react';
import { KnowledgeNode } from '../types';
import { ChatInterface } from './ChatInterface';
import { generateSpeech } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';

interface SidebarProps {
  node: KnowledgeNode;
  onClose: () => void;
  onExpand: () => void;
  onOpenModal: () => void;
  onChildClick: (child: KnowledgeNode) => void;
  // Removed system control props from here
}

type Tab = 'data' | 'voice' | 'link';

const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    node, onClose, onExpand, onOpenModal, onChildClick
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    stopAudio();
    setActiveTab('data');
    setAudioError(null);
    return () => stopAudio();
  }, [node.id]);

  const playBriefing = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    setAudioError(null);
    let textToSpeak = node.detailedContent ? stripHtml(node.detailedContent) : node.description;
    if (textToSpeak.length > 800) textToSpeak = textToSpeak.substring(0, 800) + "...";
    if (!textToSpeak) {
        setAudioError("DATA CORRUPT: NO AUDIO SOURCE");
        return;
    }

    setIsAudioLoading(true);

    try {
      const base64Audio = await generateSpeech(textToSpeak);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
        sourceNodeRef.current = source;
        setIsPlaying(true);
      } else {
          setAudioError("AUDIO STREAM FAILED");
      }
    } catch (e) {
      console.error(e);
      setAudioError("CONNECTION ERROR");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 md:w-[480px] z-40 flex flex-col pointer-events-none p-4 md:p-6 pl-0">
      
      {/* HUD Container */}
      <div className="pointer-events-auto h-full w-full bg-cyber-panel/95 border-l border-cyber-border flex flex-col relative shadow-[0_0_40px_rgba(0,0,0,0.8)] hud-panel-t-r overflow-hidden backdrop-blur-md">
        
        {/* Decorative Lines */}
        <div className="absolute top-0 right-0 w-[150px] h-[2px] bg-cyber-accent"></div>
        <div className="absolute top-0 right-[150px] w-[10px] h-[10px] bg-cyber-accent clip-path-polygon(0 0, 100% 0, 0 100%)"></div>

        {/* Node Header */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-cyber-border/50 bg-black/20 mt-2">
          <div>
             <div className="flex items-center gap-2 mb-1">
               <Cpu size={12} className="text-cyber-accent" />
               <span className="text-[10px] font-mono text-cyber-accent tracking-widest uppercase">Target Analysis</span>
             </div>
             <h2 className="text-2xl font-bold text-white font-mono break-words leading-none tracking-tighter glow-text">
               {node.name.toUpperCase()}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-cyber-danger transition-colors p-1 border border-transparent hover:border-cyber-danger/30">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 gap-1 bg-black/40 pt-2">
          {['data', 'voice', 'link'].map((t) => (
            <button 
               key={t}
               onClick={() => setActiveTab(t as Tab)}
               className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-t-2 ${activeTab === t ? 'border-cyber-accent text-white bg-white/5' : 'border-transparent text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}
            >
              {t === 'data' && <FileText size={12} />}
              {t === 'voice' && <Mic size={12} />}
              {t === 'link' && <MessageSquare size={12} />}
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-transparent to-black/80">
          
          {/* DATA TAB */}
          {activeTab === 'data' && (
             <div className="h-full overflow-y-auto custom-scrollbar p-6 flex flex-col">
                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-6 text-[10px] font-mono">
                   <div className="bg-black border border-cyber-border p-2 flex items-center justify-between">
                      <span className="text-gray-500">NODE_STATUS</span>
                      <span className={node.isLoading ? 'text-cyber-danger animate-pulse' : 'text-cyber-success'}>
                        {node.isLoading ? 'BUSY' : 'IDLE'}
                      </span>
                   </div>
                   <div className="bg-black border border-cyber-border p-2 flex items-center justify-between">
                      <span className="text-gray-500">DATA_LINK</span>
                      <span className={node.isContentLoading ? 'text-purple-400 animate-pulse' : 'text-cyber-accent'}>
                        {node.isContentLoading ? 'FETCHING' : 'STABLE'}
                      </span>
                   </div>
                </div>

                {/* Main Image */}
                <div className="mb-6 w-full aspect-video bg-black border border-cyber-border overflow-hidden relative group cursor-pointer shrink-0" onClick={onOpenModal}>
                  {node.imageUrl ? (
                    <>
                      <img src={node.imageUrl} alt={node.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 filter grayscale contrast-125" />
                      <div className="absolute inset-0 bg-cyber-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-2 right-2 bg-black/80 text-cyber-accent p-1 text-[10px] border border-cyber-accent">
                         <Maximize2 size={12} />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cyber-border gap-2">
                       {node.isContentLoading ? <Loader2 className="animate-spin text-cyber-accent" size={24} /> : <ImageIcon size={24} />}
                       <span className="text-[10px] font-mono uppercase">{node.isContentLoading ? 'Rendering...' : 'No Visual'}</span>
                    </div>
                  )}
                  {/* Overlay scanline */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                </div>

                {/* Text Content */}
                <div className="flex-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyber-border to-transparent"></div>
                  <div className="pl-4">
                      <p className="text-gray-400 leading-relaxed text-sm mb-4 font-light">
                        {node.description}
                      </p>
                      {node.detailedContent ? (
                        <div className="text-gray-300 leading-relaxed text-xs font-mono opacity-80 line-clamp-[10] border-l-2 border-cyber-accent/30 pl-3">
                           {stripHtml(node.detailedContent)}
                        </div>
                      ) : node.isContentLoading && (
                        <div className="space-y-2 opacity-30">
                          <div className="h-1 bg-cyber-accent w-full animate-pulse"></div>
                          <div className="h-1 bg-cyber-accent w-3/4 animate-pulse"></div>
                          <div className="h-1 bg-cyber-accent w-1/2 animate-pulse"></div>
                        </div>
                      )}
                      <button onClick={onOpenModal} className="mt-4 text-[10px] font-mono text-cyber-accent hover:text-white uppercase tracking-widest border border-cyber-accent/30 px-3 py-1 hover:bg-cyber-accent/10 transition-colors">
                         [ Expand Data ]
                      </button>
                  </div>
                </div>

                {/* Sources */}
                {node.sources && node.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-cyber-border/30">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-2 flex items-center gap-2">
                      <Globe size={10} /> Neural References
                    </h4>
                    <div className="flex flex-col gap-1">
                      {node.sources.slice(0, 3).map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-cyber-accent/70 hover:text-cyber-accent truncate block transition-colors font-mono hover:pl-1"
                        >
                           {'>'} {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Sub-Nodes Cards */}
                 {node.children && node.children.length > 0 && (
                   <div className="mt-8">
                      <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
                         <Layers size={12} /> Linked Sub-Nodes
                      </h4>
                      <div className="flex flex-col gap-2">
                        {node.children.map(child => (
                          <button 
                            key={child.id} 
                            onClick={() => onChildClick(child)} 
                            className="group relative text-left bg-black border border-cyber-border hover:border-cyber-accent p-3 transition-all hover:bg-cyber-accent/5 overflow-hidden"
                          >
                             {/* Card Decoration */}
                             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-accent/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-accent/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             
                             <div className="flex justify-between items-start mb-1 relative z-10">
                                <span className="font-mono text-xs font-bold text-cyber-accent group-hover:text-white transition-colors uppercase tracking-wider">
                                  {child.name}
                                </span>
                                <ChevronRight size={14} className="text-cyber-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                             </div>
                             
                             <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed font-sans opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
                               {child.description}
                             </p>
                          </button>
                        ))}
                      </div>
                   </div>
                 )}
             </div>
          )}

          {/* VOICE TAB */}
          {activeTab === 'voice' && (
            <div className="h-full p-6 flex flex-col items-center justify-center text-center relative">
               <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="w-64 h-64 border border-cyber-accent rounded-full animate-pulse-fast"></div>
                  <div className="absolute w-48 h-48 border border-cyber-accent/50 rounded-full animate-spin-slow"></div>
               </div>

               <div className="w-32 h-32 flex items-center justify-center relative z-10 mb-6">
                  {/* Hexagon shape roughly */}
                  <div className={`absolute inset-0 border-2 border-cyber-accent transform rotate-45 transition-all duration-300 ${isPlaying ? 'scale-110' : 'scale-100'}`}></div>
                  <div className={`absolute inset-0 border-2 border-cyber-accent transform rotate-12 transition-all duration-300 opacity-50 ${isPlaying ? 'scale-125' : 'scale-100'}`}></div>
                  
                  {isAudioLoading ? (
                    <Loader2 className="animate-spin text-cyber-accent" size={40} />
                  ) : isPlaying ? (
                    <button onClick={playBriefing} className="hover:scale-110 transition-transform">
                        <Square size={32} className="text-cyber-accent fill-current" />
                    </button>
                  ) : (
                    <button onClick={playBriefing} className="hover:scale-110 transition-transform">
                        <Play size={32} className="text-cyber-accent ml-1 fill-current" />
                    </button>
                  )}
               </div>
               
               <h3 className="text-lg font-bold font-mono text-white mb-2 tracking-widest">AUDIO SYNTH</h3>
               <p className="text-gray-500 text-xs font-mono max-w-xs">
                 {audioError ? <span className="text-cyber-danger">{audioError}</span> : `Initiating neural text-to-speech protocol for subject.`}
               </p>

               {/* Fake visualizer */}
               <div className="mt-8 flex items-end justify-center gap-[2px] h-12">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-cyber-accent/80"
                      style={{ 
                        height: isPlaying ? `${Math.random() * 100}%` : '2px',
                        transition: 'height 0.1s ease'
                      }}
                    ></div>
                  ))}
               </div>
            </div>
          )}

          {/* LINK TAB */}
          {activeTab === 'link' && (
            <div className="h-full p-4">
              <ChatInterface node={node} />
            </div>
          )}

        </div>

        {/* Footer Action */}
        {activeTab === 'data' && (
          <div className="p-4 border-t border-cyber-border bg-black/40 z-10">
              <button 
                onClick={onExpand}
                className={`w-full py-3 bg-cyber-accent/5 border border-cyber-accent text-cyber-accent font-bold font-mono hover:bg-cyber-accent hover:text-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs hud-btn ${node.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={node.isLoading}
              >
                {node.isLoading ? <Loader2 className="animate-spin" size={14} /> : <Wifi size={14} />}
                {node.children && node.children.length > 0 
                  ? (node.isExpanded ? 'COLLAPSE TREE' : 'EXPAND TREE') 
                  : 'INITIATE BRANCHING'}
              </button>
          </div>
        )}
      </div>
    </div>
  );
};