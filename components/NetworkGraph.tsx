import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode } from '../types';
import { Locate, ZoomIn, ZoomOut } from 'lucide-react';

interface NetworkGraphProps {
  data: KnowledgeNode;
  onNodeClick: (node: KnowledgeNode) => void;
  width: number;
  height: number;
  mergeSelection?: KnowledgeNode[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, onNodeClick, width, height, mergeSelection = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Extract IDs
  const mergeIds = new Set(mergeSelection.map(n => n.id));

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g");

    // Flatten data into nodes and links based on current expansion state
    const root = d3.hierarchy(data, (d) => d.isExpanded ? d.children : null);
    const nodes = root.descendants();
    const links = root.links();

    // Force Simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.data.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30))
      .alphaDecay(0.05);

    // Links
    const link = g.append("g")
      .attr("stroke", "#333")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("stroke-width", 1.5);

    // Nodes Group
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("mouseenter", function(event, d) {
          const linkedIds = new Set();
          linkedIds.add(d.data.id);
          link.each(function(l: any) {
            if (l.source === d || l.target === d) {
               d3.select(this).attr("stroke", "#00f3ff").attr("stroke-opacity", 1).attr("stroke-width", 3);
               linkedIds.add(l.source.data.id);
               linkedIds.add(l.target.data.id);
            }
          });
          nodeGroup.style("opacity", 0.1);
          link.style("opacity", 0.1);
          nodeGroup.filter((n: any) => linkedIds.has(n.data.id)).style("opacity", 1);
          link.filter((l: any) => l.source === d || l.target === d).style("opacity", 1);
          d3.select(this).select("circle").attr("stroke", "#fff").attr("fill", "#050505").attr("r", 25);
          d3.select(this).select("text").attr("fill", "#fff").style("font-size", "14px").style("text-shadow", "0 0 10px #00f3ff");
      })
      .on("mouseleave", function(event, d) {
          nodeGroup.style("opacity", 1);
          link.style("opacity", 1).attr("stroke", "#333").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5);
          d3.select(this).select("circle")
             .attr("stroke", (n: any) => {
                 if (mergeIds.has(n.data.id)) return '#f59e0b';
                 return n.data.isLoading ? '#ff2a6d' : '#00f3ff';
             })
             .attr("fill", "#000").attr("r", 20);
          d3.select(this).select("text").attr("fill", "#e0e0e0").style("font-size", "12px").style("text-shadow", "0 0 5px #000");
      });

    // Node Circles
    nodeGroup.append("circle")
      .attr("r", 20)
      .attr("fill", "#000")
      .attr("stroke", (d) => {
          if (mergeIds.has(d.data.id)) return '#f59e0b';
          return d.data.isLoading ? '#ff2a6d' : '#00f3ff';
      })
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-300")
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      });
    
    // Loading Animation
    nodeGroup.filter(d => !!d.data.isLoading)
        .append("circle")
        .attr("r", 25)
        .attr("fill", "none")
        .attr("stroke", "#ff2a6d")
        .attr("stroke-opacity", 0.5)
        .append("animate")
        .attr("attributeName", "r").attr("from", 20).attr("to", 40).attr("dur", "1.5s").attr("repeatCount", "indefinite")
        .select(function() { return this.parentNode as Element; })
        .append("animate").attr("attributeName", "opacity").attr("from", 1).attr("to", 0).attr("dur", "1.5s").attr("repeatCount", "indefinite");

    // Labels
    nodeGroup.append("text")
      .text(d => d.data.name)
      .attr("x", 26)
      .attr("y", 5)
      .attr("fill", "#e0e0e0")
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 5px #000");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [data, width, height, mergeSelection, onNodeClick]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
  };
  
  const handleCenter = () => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="relative w-full h-full bg-cyber-black overflow-hidden">
       <div className="absolute inset-0 pointer-events-none opacity-5" 
           style={{ 
             backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }} 
      />
      <svg ref={svgRef} width={width} height={height} className="w-full h-full block" />
       
       <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-30">
        <button onClick={() => handleZoom(1.2)} className="p-2 bg-cyber-panel border border-cyber-border text-cyber-accent hover:bg-cyber-border transition-colors rounded-sm shadow-lg">
          <ZoomIn size={20} />
        </button>
        <button onClick={() => handleZoom(0.8)} className="p-2 bg-cyber-panel border border-cyber-border text-cyber-accent hover:bg-cyber-border transition-colors rounded-sm shadow-lg">
          <ZoomOut size={20} />
        </button>
        <button onClick={handleCenter} className="p-2 bg-cyber-panel border border-cyber-border text-cyber-accent hover:bg-cyber-border transition-colors rounded-sm shadow-lg">
          <Locate size={20} />
        </button>
      </div>
    </div>
  );
};