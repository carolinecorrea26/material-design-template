import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, MarkerType, BaseEdge, EdgeLabelRenderer, Controls, type Edge, type EdgeProps, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import type { FlowDefinition, FlowNodeDef } from '../../../content/docs/flows/types';
import { computeFlowLayout, FLOW_NODE_WIDTH, type FlowMeasurements, type Size } from './layout';
import { flowNodeTypes } from './nodes';
import type { FlowRFNode } from './nodes/types';
import type { Rect, Point } from './routing';
import { useFlowMeasurement } from './measure';

function RoutedFlowEdge({ data, label, markerEnd, style }: EdgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFlowMeasurement(ref, data?.onMeasure as ((size: Size) => void) | undefined);
  const points = data?.points as Point[] | undefined, bounds = data?.labelBounds as Rect | undefined;
  if (!points?.length) return null;
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x},${point.y}`).join(' ');
  return <>
    <BaseEdge path={path} markerEnd={markerEnd} style={style} />
    {label && bounds && <EdgeLabelRenderer><Box ref={ref} className="nodrag nopan" data-flow-label="true" sx={{ position: 'absolute', transform: `translate(${bounds.x}px,${bounds.y}px)`, width: bounds.width, boxSizing: 'border-box', typography: 'caption', lineHeight: 1.4, fontWeight: 600, p: 0.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.primary', borderRadius: 1, overflowWrap: 'anywhere', whiteSpace: 'normal', pointerEvents: 'all' }}>{label}</Box></EdgeLabelRenderer>}
  </>;
}
const edgeTypes = { routed: RoutedFlowEdge };

/** Read-only graph of the canonical JSON. Geometry is a measured projection;
 * selecting a step exposes its full record instead of expanding a canvas box. */
export default function FlowDiagram({ definition, onSelectNode, initialView = 'start', compact = false }: { definition: FlowDefinition; onSelectNode?: (node: FlowNodeDef) => void; initialView?: 'start' | 'fit'; compact?: boolean }) {
  const theme = useTheme();
  const [measurements, setMeasurements] = useState<FlowMeasurements>({});
  const [selected, setSelected] = useState<string>();
  const [instance, setInstance] = useState<ReactFlowInstance<FlowRFNode>>();
  const container = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const measureCanvas = useCallback((size: Size) => setCanvasWidth(size.width), []);
  useFlowMeasurement(canvas, measureCanvas);
  const [fullscreen, setFullscreen] = useState(false);
  const userMoved = useRef(false);
  const layout = useMemo(() => computeFlowLayout(definition, measurements), [definition, measurements]);
  // Stage diagrams use normal page scrolling for height. A long vertical path
  // must not shrink all its text just to fit a fixed-height canvas.
  const compactHeight = Math.max(280, layout.bounds.height * Math.min(1, Math.max(1, canvasWidth - 40) / layout.bounds.width) + 44);
  const report = useCallback((kind: 'nodes' | 'labels', id: string, size: Size) => {
    setMeasurements(previous => {
      const before = previous[kind]?.[id];
      return before && Math.abs(before.width - size.width) < 1 && Math.abs(before.height - size.height) < 1 ? previous : { ...previous, [kind]: { ...previous[kind], [id]: size } };
    });
  }, []);
  const callbacks = useMemo(() => ({
    nodes: Object.fromEntries(definition.nodes.map(node => [node.id, (size: Size) => report('nodes', node.id, size)])),
    labels: Object.fromEntries(definition.edges.map(edge => [edge.id, (size: Size) => report('labels', edge.id, size)])),
  }), [definition, report]);
  const focusStart = useCallback(() => {
    const first = layout.nodes[0], width = canvas.current?.clientWidth;
    if (!instance || !first || !width) return;
    const zoom = Math.min(1, (width - 32) / FLOW_NODE_WIDTH);
    void instance.setViewport({ x: width / 2 - (first.position.x + FLOW_NODE_WIDTH / 2) * zoom, y: 32 - first.position.y * zoom, zoom });
  }, [instance, layout.nodes]);
  const fit = useCallback(() => {
    if (!instance || !canvas.current) return;
    const { clientWidth: w, clientHeight: h } = canvas.current, b = layout.bounds;
    const zoom = Math.min(1, (w - 40) / b.width, (h - 40) / b.height);
    void instance.setViewport({ x: (w - b.width * zoom) / 2 - b.x * zoom, y: (h - b.height * zoom) / 2 - b.y * zoom, zoom });
  }, [instance, layout.bounds]);
  const focusRef = useRef(focusStart); focusRef.current = initialView === 'fit' ? fit : focusStart;
  useEffect(() => {
    // One initial readable entry view, after the first measurement pass.
    // Later measurements preserve the user's pan/zoom.
    if (userMoved.current) return;
    const timer = window.setTimeout(() => focusRef.current(), 150);
    return () => window.clearTimeout(timer);
  }, [instance, definition.id, measurements, canvasWidth]);
  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const nodes: FlowRFNode[] = useMemo(() => layout.nodes.map(node => ({
    id: node.id, type: node.kind, position: node.position, width: FLOW_NODE_WIDTH, height: node.layoutHeight,
    measured: { width: FLOW_NODE_WIDTH, height: node.layoutHeight }, draggable: false,
    data: { ...node, active: node.id === selected, onMeasure: callbacks.nodes[node.id], onInspect: () => { setSelected(node.id); onSelectNode?.(definition.nodes.find(record => record.id === node.id)!); } },
  })), [layout.nodes, selected, callbacks, onSelectNode, definition.nodes]);
  const edges: Edge[] = useMemo(() => layout.edges.map(edge => ({
    ...edge, type: 'routed', label: edge.condition,
    data: { points: layout.edgeRoutes[edge.id], labelBounds: layout.edgeLabels[edge.id], onMeasure: callbacks.labels[edge.id] },
    style: { stroke: selected && edge.source !== selected && edge.target !== selected ? theme.palette.divider : theme.palette.text.secondary, strokeWidth: 1.5, ...(edge.styleHint === 'loop-back' ? { strokeDasharray: '5 4' } : {}) },
    markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.text.secondary },
  })), [layout, selected, theme, callbacks]);
  const current = definition.nodes.find(node => node.id === selected);
  return <Box ref={container} sx={{ bgcolor: 'background.paper', p: fullscreen ? 2 : 0 }}>
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
      <Button size="small" onClick={focusStart}>Start of flow</Button>
      <Button size="small" onClick={fit}>Fit overview</Button>
      {typeof document !== 'undefined' && document.fullscreenEnabled && <Button size="small" onClick={() => { if (fullscreen) void document.exitFullscreen(); else void container.current?.requestFullscreen(); }}>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</Button>}
      <Typography variant="caption" color="text.secondary">Drag to pan. Use +/− to zoom. Select a step for details.</Typography>
    </Stack>
    <Box ref={canvas} aria-label={`${definition.title} flowchart`} sx={{ height: fullscreen ? 'calc(100vh - 80px)' : compact ? compactHeight : { xs: '65vh', md: 680 }, minHeight: compact ? 280 : 420, width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <ReactFlow key={definition.id} nodes={nodes} edges={edges} nodeTypes={flowNodeTypes} edgeTypes={edgeTypes} onInit={setInstance}
        minZoom={0.05} maxZoom={2} nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false}
        onMoveStart={event => { if (event) userMoved.current = true; }}
        panOnDrag panOnScroll={false} zoomOnScroll={false} zoomOnDoubleClick={false} zoomOnPinch>
        <Background /><Controls showInteractive={false} showFitView={false} />
      </ReactFlow>
    </Box>
    {!onSelectNode && current && <Box sx={{ mt: 2 }}><Typography variant="subtitle1">{current.label}</Typography><Typography variant="body2">{current.description}</Typography></Box>}
  </Box>;
}
