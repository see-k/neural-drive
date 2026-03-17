import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { BackgroundGrid } from './components/BackgroundGrid';
import { VoiceInterface } from './components/VoiceInterface';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './pages/LandingPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { OrbitScopePage } from './pages/OrbitScopePage';
import { useAPIKeys } from './contexts/APIKeysContext';
import { KnowledgeGraphProvider, useKnowledgeGraph } from './contexts/KnowledgeGraphContext';
import { KnowledgeNode } from './types';
import { generateId, findNodeById } from './utils/graphUtils';

const AppContent: React.FC = () => {
  const { isConfigured } = useAPIKeys();
  const {
    rootNode,
    selectedNode,
    isMergeMode,
    initializeGraph,
    expandNode,
    toggleMergeMode,
    setSelectedNode,
    updateTree,

    handleNodeClick
  } = useKnowledgeGraph();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Auto-open settings if not configured
  useEffect(() => {
    if (!isConfigured) {
      const timer = setTimeout(() => setIsSettingsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfigured]);

  // Voice Handlers
  const handleVoiceExplore = useCallback((topic: string) => {
    if (!rootNode) {
      initializeGraph(topic);
    } else {
      const parentNode = selectedNode || rootNode;
      const newNode: KnowledgeNode = {
        id: generateId(),
        name: topic,
        description: "Voice exploration branch",
        parentId: parentNode.id,
        children: [],
        isExpanded: false,
        isLoading: false
      };

      updateTree(parentNode.id, n => ({
        ...n,
        isExpanded: true,
        children: [...(n.children || []), newNode]
      }));

      setSelectedNode(newNode);
      expandNode(newNode);
    }
  }, [rootNode, selectedNode, initializeGraph, updateTree, setSelectedNode, expandNode]);

  const handleVoiceExpand = useCallback(() => {
    if (selectedNode) {
      if (selectedNode.children && selectedNode.children.length > 0) {
        updateTree(selectedNode.id, n => ({ ...n, isExpanded: !n.isExpanded }));
      } else {
        expandNode(selectedNode);
      }
    }
  }, [selectedNode, updateTree, expandNode]);

  const handleVoiceRead = useCallback(() => {
    console.log('Voice read requested');
  }, []);

  const handleVoiceCombine = useCallback(() => {
    if (!isMergeMode) {
      toggleMergeMode();
    }
  }, [isMergeMode, toggleMergeMode]);

  const handleVoiceBack = useCallback(() => {
    if (selectedNode && selectedNode.parentId && rootNode) {
      const parent = findNodeById(rootNode, selectedNode.parentId);
      if (parent) {
        setSelectedNode(parent);
      }
    }
  }, [selectedNode, rootNode, setSelectedNode]);

  const navigate = useNavigate();
  const location = useLocation();
  const isOrbitScope = location.pathname === '/orbit-scope';

  return (
    <div className="w-full h-screen bg-cyber-black text-cyber-text font-sans relative flex flex-col overflow-hidden selection:bg-cyber-accent selection:text-black">
      <BackgroundGrid />

      <Routes>
        <Route
          path="/orbit-scope"
          element={<OrbitScopePage onOpenSettings={() => setIsSettingsOpen(true)} />}
        />
        <Route
          path="/*"
          element={
            !rootNode ? (
              <LandingPage
                onOpenSettings={() => setIsSettingsOpen(true)}
                onNavigateToOrbitScope={() => navigate('/orbit-scope')}
              />
            ) : (
              <ExplorerPage
                isVoiceEnabled={isVoiceEnabled}
                setIsVoiceEnabled={setIsVoiceEnabled}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onNavigateToOrbitScope={() => navigate('/orbit-scope')}
              />
            )
          }
        />
      </Routes>

      {/* Voice Interface - Global (hidden on OrbitScope) */}
      {!isOrbitScope && (
        <VoiceInterface
          currentTopic={selectedNode?.name || rootNode?.name}
          currentContent={selectedNode?.detailedContent || selectedNode?.description}
          onExplore={handleVoiceExplore}
          onExpand={handleVoiceExpand}
          onRead={handleVoiceRead}
          onCombine={handleVoiceCombine}
          onBack={handleVoiceBack}
          isEnabled={isVoiceEnabled}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <KnowledgeGraphProvider>
      <AppContent />
    </KnowledgeGraphProvider>
  );
};

export default App;