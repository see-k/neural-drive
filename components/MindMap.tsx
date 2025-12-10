import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode } from '../types';
import { Locate, ZoomIn, ZoomOut, Target } from 'lucide-react';

interface MindMapProps {
  data: KnowledgeNode;
  onNodeClick: (node: KnowledgeNode) => void;
  width: number;
  height: number;
  mergeSelection?: KnowledgeNode[];
}

const linkPath = (d: d3.HierarchyPointLink<KnowledgeNode>) => {
  const { source, target } = d;
  return `M${source.y},${source.x}
          C${(source.y + target.y) / 2},${source.x}
           ${(source.y + target.y) / 2},${target.x}
           ${target.y},${target.x}`;
};

const hexPoints = (radius: number) => {
  const angles = [0, 60, 120, 180, 240, 300];
  return angles.map(a => {
    const rad = (Math.PI / 180) * a;
    return `${radius * Math.cos(rad)},${radius * Math.sin(rad)}`;
  }).join(' ');
};

export const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, width, height, mergeSelection = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Store zoom behavior in ref to access it in handlers
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const mergeIds = new Set(mergeSelection.map(n => n.id));

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.main-group');

    // Layout configuration
    const treeLayout = d3.tree<KnowledgeNode>()
      .nodeSize([220, 350]) 
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.2));

    const root = d3.hierarchy<KnowledgeNode>(data, (d) => d.isExpanded ? d.children : null);
    treeLayout(root);

    // --- LINKS ---
    const linksData = root.links();
    const linksGroup = g.select('.links');
    
    // Background static link
    const links = linksGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<KnowledgeNode>>('path.link-bg')
      .data(linksData, (d) => d.target.data.id);

    links.enter()
      .append('path')
      .attr('class', 'link-bg')
      .attr('fill', 'none')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('d', (d) => {
          const o = {x: d.source.x, y: d.source.y} as any;
          return linkPath({source: o, target: o} as any);
      })
      .transition().duration(500)
      .attr('d', linkPath);

    links.transition().duration(500).attr('d', linkPath);
    links.exit().remove();

    // Active flow link
    const flowLinks = linksGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<KnowledgeNode>>('path.link-flow')
      .data(linksData, (d) => d.target.data.id);

    flowLinks.enter()
      .append('path')
      .attr('class', 'link-flow')
      .attr('fill', 'none')
      .attr('stroke', '#00f3ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5, 10')
      .attr('opacity', 0.6)
      .attr('d', (d) => {
          const o = {x: d.source.x, y: d.source.y} as any;
          return linkPath({source: o, target: o} as any);
      })
      .transition().duration(500)
      .attr('d', linkPath);

    flowLinks.transition().duration(500).attr('d', linkPath);
    flowLinks.exit().remove();

    // --- NODES ---
    const nodes = g.select('.nodes')
      .selectAll<SVGGElement, d3.HierarchyPointNode<KnowledgeNode>>('g.node')
      .data(root.descendants(), (d) => d.data.id);

    const nodeEnter = nodes.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.parent ? d.parent.y : d.y},${d.parent ? d.parent.x : d.x})`)
      .style('cursor', 'pointer');

    // 1. Hexagon Shape
    nodeEnter.append('polygon')
      .attr('points', hexPoints(12))
      .attr('fill', '#000')
      .attr('stroke', '#00f3ff')
      .attr('stroke-width', 2)
      .attr('class', 'node-hex transition-colors duration-300');

    // 2. Pulse Effect
    nodeEnter.append('circle')
      .attr('r', 20)
      .attr('fill', 'none')
      .attr('stroke', '#ff2a6d')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .attr('class', 'loading-ring');

    // 3. Title Text
    nodeEnter.append('text')
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-title font-mono text-[10px] font-bold fill-white uppercase tracking-widest')
      .style('text-shadow', '0 0 5px #000')
      .text((d) => d.data.name);

    // 4. Info Card
    const cardWidth = 200;
    const cardHeight = 80;
    
    const fo = nodeEnter.append('foreignObject')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('x', -cardWidth / 2)
      .attr('y', 20)
      .style('overflow', 'visible');

    fo.append('xhtml:div')
      .attr('class', 'node-card-wrapper w-full h-full');

    // --- UPDATE ---
    const nodeUpdate = nodes.merge(nodeEnter as any);

    // Re-attach click handler to ensure latest closure (specifically for isMergeMode) is used
    nodeUpdate.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick(d.data);
    });

    nodeUpdate.transition().duration(500)
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    nodeUpdate.select('polygon')
      .attr('stroke', (d: any) => {
         if (mergeIds.has(d.data.id)) return '#f59e0b';
         if (d.data.isLoading) return '#ff2a6d';
         return '#00f3ff';
      })
      .attr('fill', (d: any) => mergeIds.has(d.data.id) ? 'rgba(245,158,11,0.2)' : '#000');

    nodeUpdate.select('.loading-ring')
      .attr('opacity', (d: any) => d.data.isLoading ? 1 : 0)
      .each(function(d: any) {
         if (d.data.isLoading) {
            d3.select(this).append('animate')
              .attr('attributeName', 'r')
              .attr('from', 12)
              .attr('to', 25)
              .attr('dur', '1s')
              .attr('repeatCount', 'indefinite');
            d3.select(this).append('animate')
              .attr('attributeName', 'opacity')
              .attr('values', '1;0')
              .attr('dur', '1s')
              .attr('repeatCount', 'indefinite');
         } else {
            d3.select(this).selectAll('animate').remove();
         }
      });

    nodeUpdate.select('.node-card-wrapper')
      .html((d: any) => {
        const isMergeSelected = mergeIds.has(d.data.id);
        const description = d.data.description || "No data available.";
        
        let borderColor = 'border-cyber-border';
        let shadow = '';
        
        if (isMergeSelected) {
           borderColor = 'border-amber-500';
           shadow = 'shadow-[0_0_10px_rgba(245,158,11,0.3)]';
        }

        return `
          <div class="pointer-events-none">
            <div class="absolute -top-5 left-1/2 w-[1px] h-5 bg-gradient-to-b from-transparent to-cyber-border"></div>
            <div class="w-full bg-black/80 backdrop-blur-sm border ${borderColor} p-2 rounded-sm relative ${shadow}">
               <div class="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/20"></div>
               <div class="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/20"></div>
               <div class="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/20"></div>
               <div class="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/20"></div>
               <div class="text-[9px] text-gray-400 font-sans leading-relaxed line-clamp-3 text-center opacity-80">
                 ${description}
               </div>
            </div>
          </div>
        `;
      });

    nodes.exit()
      .transition().duration(500)
      .attr('opacity', 0)
      .remove();

    // Init Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    // Assign to ref
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial center on first load if we haven't zoomed yet (identity)
    const currentTransform = d3.zoomTransform(svg.node()!);
    if (currentTransform.k === 1 && currentTransform.x === 0 && currentTransform.y === 0 && root) {
       const initialTransform = d3.zoomIdentity.translate(150, height / 2).scale(0.85);
       svg.call(zoom.transform, initialTransform);
    }

  }, [data, width, height, onNodeClick, mergeSelection]);

  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };
  
  const handleCenter = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const t = d3.zoomIdentity.translate(150, height / 2).scale(0.85);
    d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, t);
  };

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden">
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -20; } }
        .link-flow { animation: flow 1s linear infinite; }
      `}</style>
      
      <svg ref={svgRef} width={width} height={height} className="w-full h-full block relative z-10">
        <g className="main-group">
          <g className="links"></g>
          <g className="nodes"></g>
        </g>
      </svg>

      <div className="absolute bottom-6 left-6 flex flex-col gap-1 z-30">
        <div className="text-[10px] font-mono text-cyber-accent mb-1 ml-1 opacity-70">OPTICS</div>
        <button onClick={() => handleZoom(1.3)} className="p-3 bg-cyber-panel/90 border border-cyber-border text-cyber-accent hover:bg-cyber-accent/10 hover:border-cyber-accent transition-all hud-btn shadow-lg group">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => handleZoom(0.7)} className="p-3 bg-cyber-panel/90 border border-cyber-border text-cyber-accent hover:bg-cyber-accent/10 hover:border-cyber-accent transition-all hud-btn shadow-lg">
          <ZoomOut size={18} />
        </button>
        <button onClick={handleCenter} className="p-3 bg-cyber-panel/90 border border-cyber-border text-cyber-accent hover:bg-cyber-accent/10 hover:border-cyber-accent transition-all hud-btn shadow-lg">
          <Target size={18} />
        </button>
      </div>
    </div>
  );
};