import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { runCoverageJourneyAcceptance } from "./coverageJourneyAcceptance";

it("runs complete member candidate journeys for every enabled product across the ten persisted Sites", async () => {
  const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
  const result = await runCoverageJourneyAcceptance(key => resolveEffectiveSite(db, key));
  expect(result.tested).toBeGreaterThan(50);
  expect(result.failures).toEqual([]);
}, 30000);
