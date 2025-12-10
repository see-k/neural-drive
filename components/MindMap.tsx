import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode } from '../types';
import { Locate, ZoomIn, ZoomOut, Target } from 'lucide-react';

interface MindMapProps {
  data: KnowledgeNode;
  onNodeClick: (node: KnowledgeNode) => void;
  width: number;
  height: number;
}

const linkPath = (d: d3.HierarchyPointLink<KnowledgeNode>) => {
  const { source, target } = d;
  // Squared stepped path for tech look
  return `M${source.y},${source.x} 
          L${(source.y + target.y) / 2},${source.x} 
          L${(source.y + target.y) / 2},${target.x} 
          L${target.y},${target.x}`;
};

export const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.main-group');

    const treeLayout = d3.tree<KnowledgeNode>()
      .nodeSize([60, 280])
      .separation((a, b) => (a.parent === b.parent ? 1.3 : 1.6));

    const root = d3.hierarchy<KnowledgeNode>(data, (d) => d.isExpanded ? d.children : null);
    treeLayout(root);

    // --- LINKS ---
    const linksData = root.links();
    const linksGroup = g.select('.links');
    
    // Background static link line
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

    // Foreground animated data flow line
    const flowLinks = linksGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<KnowledgeNode>>('path.link-flow')
      .data(linksData, (d) => d.target.data.id);

    flowLinks.enter()
      .append('path')
      .attr('class', 'link-flow')
      .attr('fill', 'none')
      .attr('stroke', '#00f3ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5, 15')
      .attr('opacity', 0.4)
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
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      })
      .on('mouseenter', function(event, d) {
          // HOVER EFFECT: Highlight path to root
          const ancestors = d.ancestors();
          const ancestorIds = new Set(ancestors.map(a => a.data.id));

          // Dim everything
          g.selectAll('.node').style('opacity', 0.2);
          g.selectAll('.link-bg').style('opacity', 0.1);
          g.selectAll('.link-flow').style('opacity', 0.05);

          // Highlight current node and ancestors
          g.selectAll('.node')
            .filter((node: any) => ancestorIds.has(node.data.id))
            .style('opacity', 1)
            .select('.node-shape')
            .attr('fill', '#050505')
            .attr('stroke', '#00f3ff')
            .attr('stroke-width', 2)
            .attr('transform', 'scale(1.8)');

          // Highlight links in path
          g.selectAll('.link-bg')
             .filter((link: any) => ancestorIds.has(link.target.data.id))
             .style('opacity', 1)
             .attr('stroke', '#00f3ff')
             .attr('stroke-width', 3);
          
          g.selectAll('.link-flow')
             .filter((link: any) => ancestorIds.has(link.target.data.id))
             .style('opacity', 1);
          
          // Show label prominently
          d3.select(this).select('text.node-label')
             .style('font-size', '14px')
             .style('text-shadow', '0 0 10px #00f3ff')
             .attr('fill', '#fff');
      })
      .on('mouseleave', function(event, d) {
          // Reset
          g.selectAll('.node').style('opacity', 1);
          g.selectAll('.link-bg').style('opacity', 1).attr('stroke', '#1a1a1a').attr('stroke-width', 2);
          g.selectAll('.link-flow').style('opacity', 0.4);
          
          g.selectAll('.node-shape')
            .attr('fill', (n: any) => n.data.isExpanded ? '#050505' : '#000')
            .attr('stroke', (n: any) => n.data.isLoading ? '#ff2a6d' : (n.data.children && n.data.children.length > 0 ? '#00f3ff' : '#444'))
            .attr('stroke-width', 1)
            .attr('transform', (n: any) => n.data.isExpanded ? 'scale(2) rotate(30)' : 'scale(1.5)');

          d3.select(this).select('text.node-label')
             .style('font-size', '10px')
             .style('text-shadow', '0 2px 5px #000')
             .attr('fill', '#e0e0e0');
      })
      .style('cursor', 'pointer');

    // Node Hexagon or Circle - Let's use Hexagon
    const hexPath = "M10,0 L5,8.66 L-5,8.66 L-10,0 L-5,-8.66 L5,-8.66 Z"; // approx small hex
    
    // Core shape
    nodeEnter.append('path')
      .attr('d', hexPath)
      .attr('transform', 'scale(1.5)')
      .attr('fill', '#000')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('class', 'node-shape')
      .transition().duration(500);

    // Rotating Ring for Selection/Active state (hidden by default)
    // IMPORTANT: Using SVG animateTransform to avoid CSS transform-origin issues causing flying objects
    const ringGroup = nodeEnter.append('g')
        .attr('class', 'selection-ring')
        .attr('opacity', 0); // show on update if selected

    const r1 = ringGroup.append('circle')
        .attr('r', 22)
        .attr('fill', 'none')
        .attr('stroke', '#00f3ff')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '10, 20')
        .attr('opacity', 0.6);
    
    r1.append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'rotate')
        .attr('from', '0 0 0')
        .attr('to', '360 0 0')
        .attr('dur', '10s')
        .attr('repeatCount', 'indefinite');
    
    const r2 = ringGroup.append('circle')
        .attr('r', 26)
        .attr('fill', 'none')
        .attr('stroke', '#00f3ff')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2, 90')
        .attr('stroke-linecap', 'round');
    
    r2.append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'rotate')
        .attr('from', '360 0 0')
        .attr('to', '0 0 0')
        .attr('dur', '15s')
        .attr('repeatCount', 'indefinite');

    // Loading State Ring
    const loadingGroup = nodeEnter.filter(d => !!d.data.isLoading)
      .append('g').attr('class', 'loading-indicator');
      
    const l1 = loadingGroup.append('circle')
      .attr('r', 18)
      .attr('fill', 'none')
      .attr('stroke', '#ff2a6d')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5, 5');
    
    l1.append('animateTransform')
        .attr('attributeName', 'transform')
        .attr('type', 'rotate')
        .attr('from', '0 0 0')
        .attr('to', '360 0 0')
        .attr('dur', '1s')
        .attr('repeatCount', 'indefinite');

    // Label
    nodeEnter.append('text')
      .attr('dy', -25)
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .text((d) => d.data.name)
      .attr('fill', '#e0e0e0')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('text-shadow', '0 2px 5px #000')
      .style('letter-spacing', '0.05em')
      .style('opacity', 0)
      .style('pointer-events', 'none') // let hover pass through to group
      .transition().duration(500)
      .style('opacity', 1);

    // Expand/Collapse + Indicator
    nodeEnter.append('text')
       .attr('dy', 4)
       .attr('text-anchor', 'middle')
       .attr('class', 'exp-indicator')
       .style('font-size', '12px')
       .style('fill', '#00f3ff')
       .style('pointer-events', 'none')
       .text('');

    // --- UPDATE ---
    const nodeUpdate = nodes.merge(nodeEnter as any)
      .transition().duration(500)
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    // Styling updates
    nodeUpdate.select('.node-shape')
       .attr('stroke', (d: any) => d.data.isLoading ? '#ff2a6d' : (d.data.children && d.data.children.length > 0 ? '#00f3ff' : '#444'))
       .attr('fill', (d: any) => d.data.isExpanded ? '#050505' : '#000')
       .attr('transform', (d: any) => d.data.isExpanded ? 'scale(2) rotate(30)' : 'scale(1.5)');

    // Show selection ring if it matches criteria
    nodeUpdate.select('.selection-ring')
        .attr('opacity', (d: any) => d.data.isExpanded ? 1 : 0);

    nodeUpdate.select('.exp-indicator')
        .text((d: any) => {
            if (d.data.isLoading) return '';
            if (d.data.children && d.data.children.length > 0) return d.data.isExpanded ? '' : '+';
            return '';
        });

    nodes.exit()
      .transition().duration(500)
      .attr('opacity', 0)
      .remove();

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform);
      });

    svg.call(zoom);

    if (transform.k === 1 && transform.x === 0 && transform.y === 0 && root) {
       const initialTransform = d3.zoomIdentity.translate(100, height / 2).scale(0.9);
       svg.call(zoom.transform, initialTransform);
    }

  }, [data, width, height, onNodeClick]);

  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy, scaleFactor);
  };
  const handleCenter = () => {
      if (!svgRef.current) return;
      const t = d3.zoomIdentity.translate(100, height / 2).scale(0.9);
      d3.select(svgRef.current).transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform, t);
  };

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden">
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -20; } }
        .link-flow { animation: flow 1s linear infinite; }
        
        /* Removed problematic rotate animations that caused flying elements */
      `}</style>
      
      <svg ref={svgRef} width={width} height={height} className="w-full h-full block relative z-10">
        <g className="main-group">
          <g className="links"></g>
          <g className="nodes"></g>
        </g>
      </svg>

      {/* Tech UI Zoom Controls */}
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
