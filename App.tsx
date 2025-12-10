import React, { useState, useCallback, useEffect } from 'react';
import { BrainCircuit, ChevronRight, Terminal, GitGraph, Network, ShieldCheck, Activity, GitMerge, Zap } from 'lucide-react';
import { MindMap } from './components/MindMap';
import { NetworkGraph } from './components/NetworkGraph';
import { ContentModal } from './components/ContentModal';
import { Sidebar } from './components/Sidebar';
import { fetchSubTopics, generateNodeContent, fetchSynthesis } from './services/geminiService';
import { KnowledgeNode } from './types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

type ViewMode = 'tree' | 'network';

// -- COMPONENT: 3D Grid Background (Moving) --
const BackgroundGrid = () => (
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

// -- COMPONENT: Boot Sequence --
const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
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

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [rootNode, setRootNode] = useState<KnowledgeNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bootComplete, setBootComplete] = useState(false);
  
  // Merge Mode State
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<KnowledgeNode[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = () => {
    if (!inputValue.trim()) return;
    
    const root: KnowledgeNode = {
      id: generateId(),
      name: inputValue,
      description: "Root Subject",
      children: [],
      isExpanded: true,
      isLoading: false
    };
    
    setRootNode(root);
    expandNode(root);
    loadNodeContent(root);
  };

  const updateTree = useCallback((nodeId: string, updater: (node: KnowledgeNode) => KnowledgeNode) => {
    setRootNode(prevRoot => {
      if (!prevRoot) return null;

      const traverse = (node: KnowledgeNode): KnowledgeNode => {
        if (node.id === nodeId) {
          return updater({ ...node });
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(traverse)
          };
        }
        return node;
      };

      const newRoot = traverse(prevRoot);
      
      // Update selected node ref if it was updated
      if (selectedNode && selectedNode.id === nodeId) {
         const findNode = (n: KnowledgeNode): KnowledgeNode | null => {
            if (n.id === nodeId) return n;
            if (n.children) {
              for (const child of n.children) {
                const found = findNode(child);
                if (found) return found;
              }
            }
            return null;
         };
         const updatedSelected = findNode(newRoot);
         if (updatedSelected) {
           setSelectedNode(updatedSelected);
         }
      }
      return newRoot;
    });
  }, [selectedNode]);

  const loadNodeContent = useCallback(async (node: KnowledgeNode) => {
    if (node.detailedContent || node.isContentLoading) return;

    updateTree(node.id, n => ({ ...n, isContentLoading: true }));

    try {
      const { content, imageUrl, sources } = await generateNodeContent(node.name);
      updateTree(node.id, n => ({
        ...n,
        detailedContent: content,
        imageUrl: imageUrl,
        sources: sources,
        isContentLoading: false
      }));
    } catch (e) {
      console.error("Failed to load node content", e);
      updateTree(node.id, n => ({ ...n, isContentLoading: false }));
    }
  }, [updateTree]);

  const expandNode = useCallback(async (node: KnowledgeNode) => {
    loadNodeContent(node);

    if (node.children && node.children.length > 0) {
      updateTree(node.id, n => ({ ...n, isExpanded: true }));
      setSelectedNode(node);
      return;
    }

    updateTree(node.id, n => ({ ...n, isLoading: true }));

    try {
      const subtopics = await fetchSubTopics(node.name, node.parentId ? "parent context" : undefined);
      const newChildren: KnowledgeNode[] = subtopics.map(t => ({
        id: generateId(),
        name: t.title,
        description: t.description,
        children: [],
        parentId: node.id,
        isExpanded: false,
        isLoading: false
      }));

      updateTree(node.id, n => ({
        ...n,
        isLoading: false,
        isExpanded: true,
        children: newChildren
      }));
      
    } catch (e) {
      console.error(e);
      updateTree(node.id, n => ({ ...n, isLoading: false }));
    }
  }, [loadNodeContent, updateTree]);

  const handleNodeClick = useCallback((node: KnowledgeNode) => {
    // MERGE MODE LOGIC
    if (isMergeMode) {
      if (mergeSelection.find(n => n.id === node.id)) {
        // Deselect
        setMergeSelection(prev => prev.filter(n => n.id !== node.id));
      } else {
        // Select (max 2)
        if (mergeSelection.length < 2) {
          setMergeSelection(prev => [...prev, node]);
        }
      }
      return;
    }

    // STANDARD NAVIGATION LOGIC
    if (!selectedNode || selectedNode.id !== node.id) {
       setSelectedNode(node);
       if (!node.detailedContent && !node.isContentLoading) {
          loadNodeContent(node);
       }
    } else {
        if (node.children && node.children.length > 0) {
            updateTree(node.id, n => ({ ...n, isExpanded: !n.isExpanded }));
        }
    }
  }, [isMergeMode, mergeSelection, selectedNode, updateTree, loadNodeContent]);

  const toggleMergeMode = () => {
    setIsMergeMode(!isMergeMode);
    setMergeSelection([]);
  };

  const executeSynthesis = async () => {
    if (mergeSelection.length !== 2) return;
    setIsSynthesizing(true);
    const [nodeA, nodeB] = mergeSelection;

    try {
      const result = await fetchSynthesis(nodeA.name, nodeB.name);
      if (result) {
        // We will append the new node to the second selected node for now, 
        // to keep the tree structure valid.
        const targetNode = nodeB;
        
        const newNode: KnowledgeNode = {
          id: generateId(),
          name: result.title,
          description: result.description,
          parentId: targetNode.id,
          children: [],
          isExpanded: false,
          isLoading: false
        };

        // Update tree
        updateTree(targetNode.id, n => ({
          ...n,
          isExpanded: true,
          children: [...(n.children || []), newNode]
        }));

        // Reset
        setIsMergeMode(false);
        setMergeSelection([]);
        setSelectedNode(newNode);
        loadNodeContent(newNode);
      }
    } catch (e) {
      console.error("Synthesis failed", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSidebarExpandClick = () => {
    if (selectedNode) {
        if (selectedNode.children && selectedNode.children.length > 0) {
             updateTree(selectedNode.id, n => ({ ...n, isExpanded: !n.isExpanded }));
        } else {
            expandNode(selectedNode);
        }
    }
  }

  const handleOpenModal = () => {
    if (selectedNode) setIsModalOpen(true);
  };

  return (
    <div className="w-full h-screen bg-cyber-black text-cyber-text font-sans relative flex flex-col overflow-hidden selection:bg-cyber-accent selection:text-black">
      
      <BackgroundGrid />

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 pointer-events-none flex flex-col md:flex-row justify-between items-start gap-8 w-full">
        <div className="pointer-events-auto flex flex-col">
          <h1 className="text-3xl font-bold font-mono text-white flex items-center gap-3 tracking-tighter">
            <BrainCircuit className="w-8 h-8 text-cyber-accent animate-pulse-fast" />
            <span className="glow-text">NEURAL_DIVE</span>
            <span className="text-[10px] bg-cyber-accent text-black px-1 rounded-sm font-bold mt-1">v3.0</span>
          </h1>
          <div className="h-[1px] w-full bg-gradient-to-r from-cyber-accent to-transparent my-2"></div>
        </div>

        {/* RESTORED: Top Right Controls (Sleek Floating Island) */}
        {rootNode && (
          <div className="pointer-events-auto flex items-center gap-4 bg-black/80 border border-cyber-border p-2 backdrop-blur-md rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
             
             {/* Mode Toggles */}
             <div className="flex bg-black/50 rounded-sm overflow-hidden border border-cyber-border">
                <button 
                  onClick={() => setViewMode('tree')}
                  className={`p-2 px-3 flex items-center gap-2 transition-colors ${viewMode === 'tree' ? 'bg-cyber-accent text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Tree View"
                >
                   <GitGraph size={16} />
                </button>
                <div className="w-[1px] bg-cyber-border"></div>
                <button 
                  onClick={() => setViewMode('network')}
                  className={`p-2 px-3 flex items-center gap-2 transition-colors ${viewMode === 'network' ? 'bg-cyber-accent text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Network Matrix"
                >
                   <Network size={16} />
                </button>
             </div>

             {/* Status Divider */}
             <div className="h-6 w-[1px] bg-cyber-border"></div>

             {/* System Status (Hidden on small screens) */}
             <div className="hidden lg:flex flex-col items-end font-mono text-[9px] text-gray-500 leading-tight">
                <span className="flex items-center gap-1 text-cyber-success"><Activity size={8} /> OPTIMAL</span>
                <span className="flex items-center gap-1"><ShieldCheck size={8} /> ENCRYPTED</span>
             </div>

             {/* Merge Controls */}
             <div className="flex items-center gap-2">
                 {isMergeMode && mergeSelection.length === 2 ? (
                     <button 
                       onClick={executeSynthesis}
                       disabled={isSynthesizing}
                       className="p-2 px-3 bg-amber-500 text-black font-bold text-xs font-mono uppercase flex items-center gap-2 shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:bg-amber-400 transition-all rounded-sm"
                     >
                       {isSynthesizing ? <Zap size={14} className="animate-spin" /> : <Zap size={14} />}
                       FUSE
                     </button>
                 ) : null}

                 <button 
                    onClick={toggleMergeMode}
                    className={`p-2 px-3 flex items-center gap-2 text-xs font-mono uppercase transition-all border rounded-sm ${
                      isMergeMode 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                        : 'bg-transparent border-cyber-border text-gray-400 hover:text-white hover:border-white'
                    }`}
                 >
                    <GitMerge size={14} /> {isMergeMode ? 'CANCEL' : 'COMBINE'}
                 </button>
             </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!rootNode ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
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
                // System: Gemini 2.5 Flash / Wikipedia API Integrated
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 relative animate-in fade-in duration-1000">
          
          {/* Instructions Overlay for Merge Mode */}
          {isMergeMode && (
             <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 bg-black/80 border border-amber-500/50 text-amber-500 px-6 py-2 rounded-full backdrop-blur-md text-xs font-mono tracking-widest animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                SELECT 2 NODES TO SYNTHESIZE [{mergeSelection.length}/2]
             </div>
          )}

          {/* Visualizations */}
          {viewMode === 'tree' ? (
            <MindMap 
              data={rootNode} 
              width={dimensions.width} 
              height={dimensions.height} 
              onNodeClick={handleNodeClick}
              mergeSelection={mergeSelection}
            />
          ) : (
            <NetworkGraph 
              data={rootNode} 
              width={dimensions.width} 
              height={dimensions.height} 
              onNodeClick={handleNodeClick}
              mergeSelection={mergeSelection}
            />
          )}
          
          {/* Sidebar - Remains visible in merge mode to provide controls */}
          {selectedNode && (
            <Sidebar 
               node={selectedNode}
               onClose={() => setSelectedNode(null)}
               onExpand={handleSidebarExpandClick}
               onOpenModal={handleOpenModal}
               onChildClick={handleNodeClick}
            />
          )}

          {/* Modal Overlay */}
          {isModalOpen && selectedNode && !isMergeMode && (
            <ContentModal node={selectedNode} onClose={() => setIsModalOpen(false)} />
          )}

        </div>
      )}
    </div>
  );
};

export default App;