import { expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { runCoverageJourneyExceptionAcceptance } from "./coverageJourneyExceptionAcceptance";

it("executes every persisted applicant/class/association/period/mode mapping", async () => {
  const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
  const sites = new Map<string, ReturnType<typeof resolveEffectiveSite>>();
  const result = await runCoverageJourneyExceptionAcceptance(key => {
    if (!sites.has(key)) sites.set(key, resolveEffectiveSite(db, key));
    return sites.get(key)!;
  });
  expect(result.tested).toBe(1834);
  expect(result.failures).toEqual([]);
  if (process.env.STEP3_ACCEPTANCE_DIR) {
    mkdirSync(resolve(process.env.STEP3_ACCEPTANCE_DIR), { recursive: true });
    writeFileSync(resolve(process.env.STEP3_ACCEPTANCE_DIR, "step3-exception-acceptance.json"), JSON.stringify({
      scope: "All persisted applicant/class/association/period/mode mappings with synthetic facts and incomplete-input rejection",
      ...result, sourceApproval: "provisional-revisit", runtimeActivation: "pending", publicationReady: false,
    }, null, 2) + "\n");
  }
}, 300000);
