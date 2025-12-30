import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { KnowledgeNode } from '../types';
import { fetchSubTopics, generateNodeContent, fetchSynthesis } from '../services/geminiService';

// -- UTILS --
import { generateId, findNodeById } from '../utils/graphUtils';

// -- TYPES --
interface KnowledgeGraphContextType {
    rootNode: KnowledgeNode | null;
    selectedNode: KnowledgeNode | null;
    isMergeMode: boolean;
    mergeSelection: KnowledgeNode[];
    isSynthesizing: boolean;

    initializeGraph: (topic: string) => void;
    expandNode: (node: KnowledgeNode) => Promise<void>;
    toggleMergeMode: () => void;
    executeSynthesis: () => Promise<void>;
    handleNodeClick: (node: KnowledgeNode) => void;

    // Expose lower level setters if needed by specific components (e.g. VoiceInterface)
    setRootNode: React.Dispatch<React.SetStateAction<KnowledgeNode | null>>;
    setSelectedNode: React.Dispatch<React.SetStateAction<KnowledgeNode | null>>;
    setMergeSelection: React.Dispatch<React.SetStateAction<KnowledgeNode[]>>;
    setIsMergeMode: React.Dispatch<React.SetStateAction<boolean>>;
    updateTree: (nodeId: string, updater: (node: KnowledgeNode) => KnowledgeNode) => void;
}

const KnowledgeGraphContext = createContext<KnowledgeGraphContextType | undefined>(undefined);

export const useKnowledgeGraph = () => {
    const context = useContext(KnowledgeGraphContext);
    if (!context) {
        throw new Error('useKnowledgeGraph must be used within a KnowledgeGraphProvider');
    }
    return context;
};

// -- PROVIDER --
export const KnowledgeGraphProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rootNode, setRootNode] = useState<KnowledgeNode | null>(null);
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

    // Merge Mode State
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [mergeSelection, setMergeSelection] = useState<KnowledgeNode[]>([]);
    const [isSynthesizing, setIsSynthesizing] = useState(false);

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
                const updatedSelected = findNodeById(newRoot, nodeId);
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

        // Context Logic
        let parentContext = "";
        if (node.parentId && rootNode) {
            const parent = findNodeById(rootNode, node.parentId);
            if (parent) parentContext = parent.name;
        }

        try {
            const subtopics = await fetchSubTopics(node.name, parentContext);
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
    }, [loadNodeContent, updateTree, rootNode]);

    const initializeGraph = useCallback((topic: string) => {
        const root: KnowledgeNode = {
            id: generateId(),
            name: topic,
            description: "Root Subject",
            children: [],
            isExpanded: true,
            isLoading: false
        };

        setRootNode(root);
        expandNode(root);
        loadNodeContent(root);
    }, [expandNode, loadNodeContent]);

    const toggleMergeMode = useCallback(() => {
        setIsMergeMode(prev => !prev);
        setMergeSelection([]);
    }, []);

    const executeSynthesis = useCallback(async () => {
        if (mergeSelection.length !== 2) return;
        setIsSynthesizing(true);
        const [nodeA, nodeB] = mergeSelection;

        try {
            const result = await fetchSynthesis(nodeA.name, nodeB.name);
            if (result) {
                // We will append the new node to the second selected node for now
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
    }, [mergeSelection, updateTree, loadNodeContent]);

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

    return (
        <KnowledgeGraphContext.Provider value={{
            rootNode,
            selectedNode,
            isMergeMode,
            mergeSelection,
            isSynthesizing,
            initializeGraph,
            expandNode,
            toggleMergeMode,
            executeSynthesis,
            handleNodeClick,
            setRootNode,
            setSelectedNode,
            setMergeSelection,
            setIsMergeMode,
            updateTree
        }}>
            {children}
        </KnowledgeGraphContext.Provider>
    );
};
