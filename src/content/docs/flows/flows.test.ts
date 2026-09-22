import { describe, expect, it } from "vitest";
import { allFlows } from "./index";
import { advisorFlow } from "./advisorFlow";
import { resumeFlow } from "./resumeFlow";
import { tpaVerificationFlow } from "./tpaVerificationFlow";
import { clients } from "../../../config/clients";
import { resolveClientFlows } from "../../../config/resolvers/resolveClientFlows";
import { pages } from "../../../config/pages";

const validPageIds = new Set(pages.map((p) => p.id));

describe.each(allFlows)("$id flow content", (flow) => {
  it("has unique node ids", () => {
    const ids = flow.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique edge ids", () => {
    const ids = flow.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has edges that only reference node ids present in the flow", () => {
    const nodeIds = new Set(flow.nodes.map((n) => n.id));
    for (const edge of flow.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it("has valid pageId references for every page node", () => {
    for (const node of flow.nodes) {
      if (node.kind === "page") {
        expect(node.pageId).toBeDefined();
        expect(validPageIds.has(node.pageId!)).toBe(true);
      } else {
        expect(node.pageId).toBeUndefined();
      }
    }
  });
});

describe("documented branches are preserved", () => {
  it("advisor flow: Send Application Dialog Cancel returns to Profile", () => {
    const edge = advisorFlow.edges.find(
      (e) => e.source === "advisor-send-dialog" && e.condition === "Cancel",
    );
    expect(edge?.target).toBe("advisor-profile");
    expect(edge?.styleHint).toBe("loop-back");
  });

  it("advisor flow: edit-request dialog Cancel returns to Review (advisor mode)", () => {
    const edge = advisorFlow.edges.find(
      (e) => e.source === "advisor-edit-dialog" && e.condition === "Cancel",
    );
    expect(edge?.target).toBe("advisor-review");
    expect(edge?.styleHint).toBe("loop-back");
  });

  it("resume flow: unsuccessful verification loops back to Resume Code", () => {
    const edge = resumeFlow.edges.find((e) => e.condition === "Unsuccessful");
    expect(edge?.source).toBe("resume-result-decision");
    expect(edge?.target).toBe("resume-code");
    expect(edge?.styleHint).toBe("loop-back");
  });

  it("resume flow: both verification-code delivery methods converge on Resume Code", () => {
    const methodEdges = resumeFlow.edges.filter((e) => e.source === "resume-method");
    expect(methodEdges.map((e) => e.condition).sort()).toEqual(["Call", "Text"]);
    expect(methodEdges.every((e) => e.target === "resume-code")).toBe(true);
  });

  it("TPA flow: method decision has all four documented choices", () => {
    const methodEdges = tpaVerificationFlow.edges.filter((e) => e.source === "tpa-method-decision");
    expect(methodEdges.map((e) => e.condition).sort()).toEqual(
      ["Proceed without verification", "Security questions", "Text code", "Voice code"].sort(),
    );
  });

  it("TPA flow: proceeding without verification bypasses the verification-result decision", () => {
    const edge = tpaVerificationFlow.edges.find(
      (e) => e.source === "tpa-method-decision" && e.condition === "Proceed without verification",
    );
    expect(edge?.target).toBe("tpa-unverified-outcome");
  });

  it("TPA flow: failed verification continues regular application without portfolio", () => {
    const edge = tpaVerificationFlow.edges.find(
      (e) => e.source === "tpa-result-decision" && e.condition === "No",
    );
    expect(edge?.target).toBe("tpa-unverified-outcome");
  });

  it("TPA flow: successful verification continues regular application with portfolio", () => {
    const edge = tpaVerificationFlow.edges.find(
      (e) => e.source === "tpa-result-decision" && e.condition === "Yes",
    );
    expect(edge?.target).toBe("tpa-verified-outcome");
  });

  it("WAEPA override: new members auto-approve without portfolio", () => {
    const membershipEdge = resolveClientFlows(clients.waepa).find((f) => f.id === "tpaVerification")!.effective.edges.find(
      (e) => e.source === "waepa-membership-decision" && e.condition === "New member",
    );
    expect(membershipEdge?.target).toBe("waepa-new-member");
    const outcomeEdge = resolveClientFlows(clients.waepa).find((f) => f.id === "tpaVerification")!.effective.edges.find(
      (e) => e.source === "waepa-new-member",
    );
    expect(outcomeEdge?.target).toBe("waepa-new-member-outcome");
  });

  it("WAEPA override: verified current members get portfolio-enabled outcome", () => {
    const edge = resolveClientFlows(clients.waepa).find((f) => f.id === "tpaVerification")!.effective.edges.find(
      (e) => e.source === "waepa-verification-decision" && e.condition === "Yes",
    );
    expect(edge?.target).toBe("waepa-current-success");
  });
});
