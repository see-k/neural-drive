import { KnowledgeNode } from '../types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const findNodeById = (node: KnowledgeNode | null, id: string): KnowledgeNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
};
