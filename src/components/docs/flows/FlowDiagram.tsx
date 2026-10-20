import { useMemo } from "react";
import { ReactFlow, Background, MarkerType, BaseEdge, EdgeLabelRenderer, Controls, type Edge, type EdgeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Typography } from "@mui/material";
import type { FlowDefinition } from "../../../content/docs/flows/types";
import { computeFlowLayout, FLOW_NODE_WIDTH } from "./layout";
import { flowNodeTypes } from "./nodes";
import type { FlowRFNode } from "./nodes/types";

/** Use the obstacle-aware path computed alongside the node positions. */
function RoutedFlowEdge({ data, label, markerEnd, style }: EdgeProps) {
  const points = data?.points as { x: number; y: number }[] | undefined;
  if (!points?.length) return null;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`).join(" ");
  const midpoint = points[Math.floor(points.length / 2)];
  return <>
    <BaseEdge path={path} markerEnd={markerEnd} style={style} />
    {label && <EdgeLabelRenderer><div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${midpoint.x}px,${midpoint.y}px)`, fontSize: 11, fontWeight: 600, padding: "2px 4px", background: "white", borderRadius: 3 }}>{label}</div></EdgeLabelRenderer>}
  </>;
}
const edgeTypes = { routed: RoutedFlowEdge };

const MIN_DIAGRAM_HEIGHT = 340;
const MAX_DIAGRAM_HEIGHT = 900;

export default function FlowDiagram({ definition }: { definition: FlowDefinition }) {
  const { nodes, edges, edgeRoutes } = useMemo(() => computeFlowLayout(definition), [definition]);

  // Size the box to the graph instead of a fixed height: a fixed height
  // forces very tall, mostly-linear flows (e.g. advisor's 18 nodes) down to
  // an unreadably tiny fitView zoom. Clamped so short flows stay compact and
  // very tall ones still get a scroll/zoom-friendly box rather than growing
  // without bound.
  const diagramHeight = useMemo(() => {
    if (nodes.length === 0) return MIN_DIAGRAM_HEIGHT;
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + n.layoutHeight));
    return Math.min(MAX_DIAGRAM_HEIGHT, Math.max(MIN_DIAGRAM_HEIGHT, maxY - minY + 120));
  }, [nodes]);

  const rfNodes: FlowRFNode[] = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: node.kind,
        position: node.position,
        data: node,
        draggable: false,
        // `measured` (not the top-level width/height) is what React Flow's
        // fitView and useNodesInitialized actually read to decide a node is
        // ready. Declaring it upfront — matching what FlowNodeShell actually
        // renders at and what layout.ts told dagre — lets fitView compute
        // correct bounds on first render instead of waiting on (and in a
        // static, never-re-set nodes array, never getting) a ResizeObserver
        // pass that updates individual nodes without ever flipping the
        // store's aggregate "initialized" flag.
        width: FLOW_NODE_WIDTH,
        height: node.layoutHeight,
        measured: { width: FLOW_NODE_WIDTH, height: node.layoutHeight },
      })),
    [nodes],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.condition,
        type: "routed",
        data: { points: edgeRoutes[edge.id] },
        animated: edge.styleHint === "loop-back",
        style: edge.styleHint === "loop-back" ? { strokeDasharray: "4 4" } : undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        labelBgPadding: [4, 2] as [number, number],
        labelStyle: { fontSize: 11, fontWeight: 600 },
      })),
    [edges, edgeRoutes],
  );

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {definition.intro}
      </Typography>
      <Box
        sx={{
          height: diagramHeight,
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <ReactFlow
          key={definition.id}
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={flowNodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          // React Flow's default minZoom (0.5) floors how far fitView can
          // zoom out — too shallow for a 480px box holding a tall, mostly
          // linear flow (e.g. advisor's 18 nodes), which silently clips the
          // top of the graph instead of shrinking it to fit.
          minZoom={0.05}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable={false}
          panOnDrag
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </Box>
  );
}
