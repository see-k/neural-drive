import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Loader2 } from 'lucide-react';
import { createChat } from '../services/geminiService';
import { KnowledgeNode } from '../types';
import { GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ChatInterfaceProps {
  node: KnowledgeNode;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ node }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSession = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset chat when node changes
    setMessages([]);
    chatSession.current = createChat(node.name, node.detailedContent || node.description);
  }, [node]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg });
      const text = result.text;
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Connection interrupted. Neural link unstable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 border border-cyber-border rounded-sm overflow-hidden">
      <div className="bg-cyber-dark p-2 border-b border-cyber-border flex items-center gap-2">
        <Terminal size={14} className="text-cyber-accent" />
        <span className="text-xs font-mono text-cyber-accent uppercase tracking-wider">Neural Link // {node.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs font-mono mt-8">
            <p>Uplink established.</p>
            <p>Ask specifically about {node.name}.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-sm text-sm font-mono leading-relaxed ${msg.role === 'user'
              ? 'bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-text'
              : 'bg-cyber-panel border border-gray-700 text-gray-300'
              }`}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  a: ({ node, ...props }) => <a className="text-cyber-accent underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                  code: ({ node, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !match ? (
                      <code className="bg-white/10 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                    ) : (
                      <div className="bg-black/50 p-2 rounded border border-gray-700 my-2 overflow-x-auto">
                        <code className={className} {...props}>{children}</code>
                      </div>
                    )
                  }
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-cyber-panel border border-gray-700 p-3 rounded-sm">
              <Loader2 className="animate-spin text-cyber-accent" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-cyber-border bg-cyber-dark">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Transmit query..."
            className="w-full bg-black border border-cyber-border text-white p-2 pr-10 text-sm font-mono focus:outline-none focus:border-cyber-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-cyber-accent hover:text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
