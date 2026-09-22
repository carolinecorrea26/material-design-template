import type { PageId } from "../../../types";

/** Stable identifier for a flow (React key, doc anchor, test fixture name). */
export type FlowId =
  | "consumer"
  | "advisor"
  | "resume"
  | "autosave"
  | "quote"
  | "tpaVerification";

export type FlowNodeKind =
  | "start" // flow entry point that isn't itself a routed page
  | "end" // terminal state that isn't itself a routed page
  | "page" // maps to a real PageId — must carry pageId
  | "decision" // user/system branch point with more than one outgoing labeled edge
  | "action" // a dialog/modal/system step that isn't a routed page (e.g. SendApplicationDialog)
  | "summary" // stands in for a set of real pages that aren't sequential/branchable in a documented way
  | "external"; // a system outside the portal that the flow depends on but doesn't route through (e.g. TPA lookup, DocuSign)

export type FlowNodeDef = {
  /** Flow-local id, conventionally `${flowId}-${slug}`. Independent of pageId. */
  id: string;
  kind: FlowNodeKind;
  label: string;
  description?: string;
  /** Only present when kind === "page" — the real page this node represents. */
  pageId?: PageId;
};

export type FlowEdgeStyleHint =
  | "normal"
  | "loop-back" // returns to an earlier node (e.g. cancel, unsuccessful verification)
  | "dialog-return"; // ownership/control transfers back to another actor

export type FlowEdgeDef = {
  id: string;
  source: string; // FlowNodeDef.id
  target: string; // FlowNodeDef.id
  /** Branch label, e.g. "Send", "Cancel", "Text code", "Unsuccessful". Undefined for unconditional edges. */
  condition?: string;
  styleHint?: FlowEdgeStyleHint;
};

export type FlowDefinition = {
  id: FlowId;
  title: string;
  /** Framing prose, rendered once above the diagram. */
  intro: string;
  nodes: FlowNodeDef[];
  edges: FlowEdgeDef[];
};
