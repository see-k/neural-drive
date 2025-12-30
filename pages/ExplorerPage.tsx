import React, { useState, useEffect } from 'react';
import { GitGraph, Network, Activity, ShieldCheck, Zap, GitMerge, Mic, MicOff } from 'lucide-react';
import { MindMap } from '../components/MindMap';
import { NetworkGraph } from '../components/NetworkGraph';
import { Sidebar } from '../components/Sidebar';
import { ContentModal } from '../components/ContentModal';
import { useKnowledgeGraph } from '../contexts/KnowledgeGraphContext';
import { useAPIKeys } from '../contexts/APIKeysContext';
import { Header } from '../components/Header';

type ViewMode = 'tree' | 'network';

interface ExplorerPageProps {
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (enabled: boolean) => void;
    onOpenSettings: () => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
    isVoiceEnabled,
    setIsVoiceEnabled,
    onOpenSettings
}) => {
    const { isConfigured } = useAPIKeys();
    const {
        rootNode,
        selectedNode,
        isMergeMode,
        mergeSelection,
        isSynthesizing,
        toggleMergeMode,
        executeSynthesis,
        handleNodeClick,
        expandNode,
        setSelectedNode,
        updateTree
    } = useKnowledgeGraph();

    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const ExplorerControls = (
        <>
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

            <div className="h-6 w-[1px] bg-cyber-border"></div>

            <div className="hidden lg:flex flex-col items-end font-mono text-[9px] text-gray-500 leading-tight">
                <span className="flex items-center gap-1 text-cyber-success"><Activity size={8} /> OPTIMAL</span>
                <span className="flex items-center gap-1"><ShieldCheck size={8} /> ENCRYPTED</span>
            </div>

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
                    className={`p-2 px-3 flex items-center gap-2 text-xs font-mono uppercase transition-all border rounded-sm ${isMergeMode
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'bg-transparent border-cyber-border text-gray-400 hover:text-white hover:border-white'
                        }`}
                >
                    <GitMerge size={14} /> {isMergeMode ? 'CANCEL' : 'COMBINE'}
                </button>

                <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-2 px-3 flex items-center gap-2 text-xs font-mono uppercase transition-all border rounded-sm ${isVoiceEnabled
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-transparent border-cyber-border text-gray-400 hover:text-white hover:border-white'
                        }`}
                    title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                >
                    {isVoiceEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    VOICE
                </button>
            </div>
        </>
    );

    return (
        <div className="flex-1 relative animate-in fade-in duration-1000 w-full h-full">
            <Header
                controls={ExplorerControls}
                onOpenSettings={onOpenSettings}
                isConfigured={isConfigured}
                className={selectedNode ? 'md:mr-[490px] mr-80' : 'mr-0'}
            />

            {isMergeMode && (
                <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 bg-black/80 border border-amber-500/50 text-amber-500 px-6 py-2 rounded-full backdrop-blur-md text-xs font-mono tracking-widest animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    SELECT 2 NODES TO SYNTHESIZE [{mergeSelection.length}/2]
                </div>
            )}

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

            {selectedNode && (
                <Sidebar
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onExpand={handleSidebarExpandClick}
                    onOpenModal={handleOpenModal}
                    onChildClick={handleNodeClick}
                />
            )}

            {isModalOpen && selectedNode && !isMergeMode && (
                <ContentModal node={selectedNode} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};
