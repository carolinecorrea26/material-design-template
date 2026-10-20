import { describe, expect, it } from "vitest";
import { LocalStorageAdapter, LOCAL_DATABASE_KEY, type StorageLike } from "../persistence/localAdapter";
import { createSeedDatabase } from "../persistence/seed";
import { defaultMigrationSchedule, MigrationScheduleService } from "./migrationScheduleService";

const storage = (): StorageLike => {
  const entries = new Map<string, string>();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); }, removeItem: key => { entries.delete(key); } };
};
describe("migration schedule persistence", () => {
  it("defaults only ASCE and AAFP to migrating without assuming acceptance or dates", () => {
    for (const key of [...createSeedDatabase().clients.map(client => client.key), "aafp"]) {
      const schedule = defaultMigrationSchedule(key);
      expect(schedule.migrating).toBe(["asce", "aafp"].includes(key.toLowerCase()));
      expect(schedule.expectedDate).toBeNull();
      expect(Object.values(schedule.milestones).every(stage => stage.status === "Not assessed" && stage.expectedDate === null)).toBe(true);
    }
  });
  it("retains independent environment statuses, dates and migrating choices after reopening", async () => {
    const store = storage();
    const service = new MigrationScheduleService(new LocalStorageAdapter(createSeedDatabase(), store));
    const row = defaultMigrationSchedule("aafp");
    row.milestones.uat = { status: "In progress", expectedDate: "2026-11-02" };
    row.milestones.production = { status: "Blocked", expectedDate: null };
    row.notes = "Awaiting requirements approval";
    await service.save(row);
    row.migrating = false;
    await service.save(row);
    const reopened = new MigrationScheduleService(new LocalStorageAdapter(createSeedDatabase(), store));
    expect(await reopened.list()).toEqual([expect.objectContaining({ migrating: false, notes: row.notes, milestones: row.milestones })]);
    expect((await reopened.list())[0].milestones.preprod.status).toBe("Not assessed");
  });
  it("adds the schedule table to previously saved local databases without losing existing data", async () => {
    const store = storage();
    const legacy = { ...createSeedDatabase() } as Record<string, unknown>;
    delete legacy.migrationSchedules;
    store.setItem(LOCAL_DATABASE_KEY, JSON.stringify(legacy));
    const adapter = new LocalStorageAdapter(createSeedDatabase(), store);
    const service = new MigrationScheduleService(adapter);
    expect(await service.list()).toEqual([]);
    await service.save(defaultMigrationSchedule("asce"));
    expect(await adapter.list("clients")).toEqual(legacy.clients);
  });
  it("rejects invalid dates and statuses before persisting", async () => {
    const service = new MigrationScheduleService(new LocalStorageAdapter(createSeedDatabase()));
    const row = defaultMigrationSchedule("asce");
    row.expectedDate = "2026-02-30";
    await expect(service.save(row)).rejects.toThrow("valid statuses and expected dates");
    row.expectedDate = null;
    row.milestones.uat.status = "Approved" as never;
    await expect(service.save(row)).rejects.toThrow("valid statuses and expected dates");
    expect(await service.list()).toEqual([]);
  });
});
