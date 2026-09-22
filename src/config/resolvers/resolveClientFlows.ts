import type { ClientConfig } from "../clients/types";
import { allFlows as globalFlows } from "../../content/docs/flows";
import type { FlowDefinition, FlowId } from "../../content/docs/flows/types";
import type { ResolutionStatus } from "./types";

export type ResolvedFlow = {
  id: FlowId;
  global: FlowDefinition;
  override?: FlowDefinition;
  effective: FlowDefinition;
  status: ResolutionStatus;
  clientDiffs: string[];
};

function summarizeFlowDiff(global: FlowDefinition, override: FlowDefinition): string[] {
  const diffs: string[] = [];
  if (global.intro !== override.intro) diffs.push("flow behavior/description");
  if (global.nodes.length !== override.nodes.length) diffs.push("nodes/routing steps");
  if (global.edges.length !== override.edges.length) diffs.push("branch routing");
  if (diffs.length === 0 && JSON.stringify(global) !== JSON.stringify(override)) diffs.push("flow definition");
  return diffs;
}

export function resolveClientFlows(client: ClientConfig): ResolvedFlow[] {
  return globalFlows.map((global) => {
    const override = client.flows?.overrides?.[global.id];
    return {
      id: global.id,
      global,
      override,
      effective: override ?? global,
      status: override ? "overridden" : "inherited",
      clientDiffs: override ? summarizeFlowDiff(global, override) : [],
    };
  });
}
