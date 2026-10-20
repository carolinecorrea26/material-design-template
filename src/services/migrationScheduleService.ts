import { persistence } from "../persistence/client";
import type { PersistenceAdapter } from "../persistence/adapter";
import { migrationStages, migrationStatuses, type MigrationSchedule } from "../persistence/types";

export function defaultMigrationSchedule(clientKey: string): MigrationSchedule {
  const key = clientKey.toLowerCase();
  return {
    id: `migration-${key}`, clientKey, migrating: ["asce", "aafp"].includes(key),
    milestones: Object.fromEntries(migrationStages.map(({ key }) => [key, { status: "Not assessed", expectedDate: null }])) as MigrationSchedule["milestones"],
    expectedDate: null, notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export class MigrationScheduleService {
  private readonly adapter: PersistenceAdapter;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; }
  async list() { return this.adapter.list("migrationSchedules"); }
  async save(schedule: MigrationSchedule) {
    const validDate = (date: string | null) => date === null || (/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date);
    if (!validDate(schedule.expectedDate) || migrationStages.some(({ key }) => !migrationStatuses.includes(schedule.milestones[key]?.status) || !validDate(schedule.milestones[key]?.expectedDate))) {
      throw new Error("Choose valid statuses and expected dates for every stage.");
    }
    const previous = await this.adapter.get("migrationSchedules", schedule.id);
    const row = { ...schedule, updatedAt: new Date().toISOString() };
    return previous ? this.adapter.update("migrationSchedules", row.id, row) : this.adapter.insert("migrationSchedules", row);
  }
}
export const migrationScheduleService = new MigrationScheduleService();
