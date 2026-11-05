import { createMigrationDatabase } from "./fixtures";
import type { ClientSupport } from "../domain/configuration";

/** Historical transport tests compare the pre-adoption template. Accepted
 * October 19 program-contact changes have their own source/owner acceptance. */
export function createLegacyCompatibilityFixture() {
  const db = createMigrationDatabase();
  // The historical inspector treated every health page as required. Keep that
  // behavior in its comparison fixture; current readers honor saved assignments.
  for (const row of db.sitePages) {
    if (db.pages.some(page => page.key === row.pageKey && page.definition.healthGate)) row.requirement = "required";
  }
  const contacts = db.semanticRequirements.filter(row => row.predicate === "program-contact-source");
  for (const decision of contacts) {
    const value = decision.value as { previousSupport: ClientSupport; destination: { key: string } };
    const profile = db.supportProfiles.find(row => row.key === value.destination.key);
    if (!profile) throw new Error(`Missing original contact profile: ${decision.key}`);
    profile.definition = structuredClone(value.previousSupport);
  }
  db.semanticRequirements = db.semanticRequirements.filter(row => !contacts.includes(row));
  return db;
}
