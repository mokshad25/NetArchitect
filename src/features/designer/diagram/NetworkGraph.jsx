import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import { readVars } from '../../../lib/cssVars.js';
import { useTheme } from '../../../lib/useTheme.js';
import { DIAGRAM_VARS, VIS_OPTIONS, toVisEdge, toVisNode } from './diagramTheme.js';

/**
 * vis-network renderer for the engine graph. Theme-aware: on theme change the
 * node/edge styles are updated in place so the current zoom and pan are kept.
 * Exposes fit(), zoom(factor), focus(id) and exportPng() through the ref.
 * (Loaded lazily so vis-network is only downloaded on /app.)
 */
const NetworkGraph = forwardRef(function NetworkGraph({ graph, selectedId, onSelect }, ref) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const netRef = useRef(null);
  const dataRef = useRef(null);
  const colorsRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the network whenever the graph changes.
  useEffect(() => {
    const colors = readVars(DIAGRAM_VARS);
    colorsRef.current = colors;
    const levelOf = Object.fromEntries(graph.nodes.map((n) => [n.id, n.level]));
    const nodes = new DataSet(graph.nodes.map((n) => toVisNode(n, colors)));
    const edges = new DataSet(graph.edges.map((e) => toVisEdge(e, colors, levelOf)));
    const network = new Network(containerRef.current, { nodes, edges }, VIS_OPTIONS);
    dataRef.current = { nodes, edges, levelOf };
    netRef.current = network;

    // Paint the canvas background so exported PNGs match the theme.
    network.on('beforeDrawing', (ctx) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = colorsRef.current['--canvas'];
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    });
    network.on('click', (p) => onSelectRef.current(p.nodes[0] ?? null));
    network.once('afterDrawing', () => network.fit({ animation: false }));
    // Redraw once web fonts are ready so canvas labels use them.
    document.fonts?.ready.then(() => netRef.current === network && network.redraw());

    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      network.redraw();
      network.fit({ animation: false });
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      network.destroy();
      netRef.current = null;
    };
  }, [graph]);

  // Re-style in place when the theme changes.
  useEffect(() => {
    const data = dataRef.current;
    if (!data || !netRef.current) return;
    const colors = readVars(DIAGRAM_VARS);
    if (colors['--canvas'] === colorsRef.current?.['--canvas']) return;
    colorsRef.current = colors;
    data.nodes.update(graph.nodes.map((n) => toVisNode(n, colors)));
    data.edges.update(graph.edges.map((e) => toVisEdge(e, colors, data.levelOf)));
    netRef.current.redraw();
  }, [theme, graph]);

  // Keep the vis selection in sync with the drawer.
  useEffect(() => {
    const net = netRef.current;
    if (!net) return;
    if (selectedId) net.selectNodes([selectedId]);
    else net.unselectAll();
  }, [selectedId, graph]);

  useImperativeHandle(ref, () => ({
    fit: () => netRef.current?.fit({ animation: { duration: 250, easingFunction: 'easeOutQuad' } }),
    zoom: (factor) => {
      const net = netRef.current;
      if (!net) return;
      net.moveTo({ scale: net.getScale() * factor, animation: { duration: 150, easingFunction: 'easeOutQuad' } });
    },
    focus: (id) =>
      netRef.current?.focus(id, { scale: 1.3, animation: { duration: 250, easingFunction: 'easeOutQuad' } }),
    exportPng: () => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `netarchitect-topology-${theme}.png`;
      a.click();
    },
  }));

  return <div className="graph-canvas" ref={containerRef} />;
});

export default NetworkGraph;
