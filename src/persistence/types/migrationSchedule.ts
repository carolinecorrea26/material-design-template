import type { Timestamped } from "./common";

export const migrationStatuses = ["Not assessed", "Not started", "In progress", "In review", "Blocked", "Complete"] as const;
export type MigrationStatus = typeof migrationStatuses[number];
export const migrationStages = [
  { key: "requirements", label: "Requirements" },
  { key: "prototype", label: "Prototype" },
  { key: "uat", label: "UAT" },
  { key: "preprod", label: "Preprod" },
  { key: "production", label: "Production" },
] as const;
export type MigrationStage = typeof migrationStages[number]["key"];
export type MigrationMilestone = { status: MigrationStatus; expectedDate: string | null };
export interface MigrationSchedule extends Timestamped {
  id: string;
  clientKey: string;
  migrating: boolean;
  milestones: Record<MigrationStage, MigrationMilestone>;
  expectedDate: string | null;
  notes: string;
}
