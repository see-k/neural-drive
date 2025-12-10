
export interface KnowledgeNode {
  id: string;
  name: string;
  description: string;
  children?: KnowledgeNode[];
  _children?: KnowledgeNode[]; // Used for collapsing state in D3 if needed, though we manage via React state mostly
  isExpanded?: boolean;
  isLoading?: boolean;
  parentId?: string;
  // New fields for rich content
  detailedContent?: string;
  imageUrl?: string;
  isContentLoading?: boolean;
  sources?: { title: string; uri: string }[];
}

export interface SubTopicResponse {
  title: string;
  description: string;
}

export interface NodeContentResponse {
  content: string;
  imageUrl?: string;
  sources?: { title: string; uri: string }[];
}
