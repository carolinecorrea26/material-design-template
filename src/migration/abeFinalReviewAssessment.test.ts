import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assessment from "../../docs/project-review/abe-final-review.json";
import { currentMcrSource } from "./currentMcr";
import { createReviewedMigrationDatabase } from "./fixtures";
import { abeFinalReviewNativeHash } from "./requirementCrosswalkSites";
import type { DatabaseSchema } from "../persistence/types";
it("records every reviewed source item and all seven implemented decisions with no unanswered questions", () => {
  expect(assessment.status).toBe("approved-changes-implemented");
  expect(assessment.prototypeChangedByThisReview).toBe(true);
  expect(assessment.pendingQuestions).toEqual([]);
  expect(assessment.counts.unclassified).toBe(0);
  expect(assessment.questions).toHaveLength(7);
  expect(assessment.questions.every(question => question.status === "answered-and-implemented" && question.decision.length > 40)).toBe(true);
  expect(assessment.reviewedQueue.length).toBeGreaterThan(500);
  expect(assessment.supporting.length).toBeGreaterThan(150);
  for (const receipt of [...assessment.reviewedQueue, ...assessment.supporting, ...assessment.unassigned, ...assessment.absences, ...assessment.additionalSources]) {
    expect(receipt.disposition).not.toBe("reviewed-awaiting-specific-answer");
    for (const [ref, expected] of Object.entries(receipt.sourceHashes)) {
      const [sheet, coordinate] = ref.split("!");
      const cell = currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === coordinate);
      expect(createHash("sha256").update(JSON.stringify(cell)).digest("hex")).toBe(expected);
    }
  }
  for (const [path, expected] of Object.entries(assessment.files)) expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(expected);
});

it("keeps the final ABE sign-off tied to both the reviewed implementation and the shipped catalog", () => {
  const reviewed = createReviewedMigrationDatabase();
  const saved = JSON.parse(readFileSync("public/catalog/portal.json", "utf8")) as { data: DatabaseSchema };
  expect(abeFinalReviewNativeHash(reviewed)).toBe(assessment.nativeFingerprint);
  expect(abeFinalReviewNativeHash(saved.data)).toBe(assessment.nativeFingerprint);
}, 120000);
