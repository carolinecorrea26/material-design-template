import { beforeAll, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { LocalStorageAdapter } from "./localAdapter";
import { createMigrationDatabase } from "../migration/fixtures";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { localSnapshotRevision, validateSnapshotRequest, type SnapshotTable } from "./snapshot";
import { queryRows } from "./query";
import type { DatabaseSchema } from "./types";

let db: DatabaseSchema;
beforeAll(() => { vi.stubGlobal("crypto", webcrypto); db = createMigrationDatabase(); });
describe("normalized revision boundary", () => {
  it("captures storage once before awaiting hashing and detaches rows", async () => {
    let stored = JSON.stringify(db);
    const getItem = vi.fn(() => stored);
    const adapter = new LocalStorageAdapter(db, { getItem, setItem: (_, value) => { stored = value; }, removeItem: () => {} });
    const pending = adapter.readSnapshot(["sites", "clients"]);
    stored = JSON.stringify({ ...db, sites: db.sites.map(site => ({ ...site, name: "Later" })) });
    const snapshot = await pending;
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(snapshot.data.sites).toEqual(db.sites);
    snapshot.data.sites[0].name = "Detached";
    expect((await adapter.readSnapshot(["sites"])).data.sites[0].name).toBe("Later");
  });
  it("keeps old handles immutable while a fresh revision sees persisted edits", async () => {
    const adapter = new LocalStorageAdapter(db);
    const repository = createPortalDataRepository(adapter);
    const old = await repository.open();
    const original = old.resolveSite("asce");
    const id = db.sites.find(site => site.key === "asce")!.id;
    const rows = old.query("sites", { filters: { key: "asce" }, limit: 1 });
    expect(rows.revision).toBe(original.revision);
    rows.rows[0].name = "Caller edit";
    await adapter.update("sites", id, { name: "Persisted edit" });
    const fresh = await repository.open();
    expect(fresh.revision).not.toBe(old.revision);
    expect(old.resolveSite("asce")).toEqual(original);
    expect(fresh.resolveSite("asce").site.name.value).toBe("Persisted edit");
    expect(old.get("sites", id)!.name).not.toBe("Caller edit");
    await adapter.remove("semanticRequirements", db.semanticRequirements.find(row => row.domain === "approved-business-decision" && row.subjectKey === "asce" && row.predicate === "approved-canonical-site-rule")!.id);
    expect(() => old.resolveSite("asce")).not.toThrow();
    expect(() => fresh.resolveSite("asce")).not.toThrow();
    const changed = await repository.open();
    expect(() => changed.resolveSite("asce")).toThrow("Unapproved");
  });
  it("hashes content independently of table, row and object key order", async () => {
    const first = await localSnapshotRevision({ sites: db.sites, clients: db.clients });
    const reordered = db.sites.map(row => Object.fromEntries(Object.entries(row).reverse())) as DatabaseSchema["sites"];
    expect(await localSnapshotRevision({ clients: [...db.clients].reverse(), sites: reordered.reverse() })).toBe(first);
    expect(await localSnapshotRevision({ sites: db.sites.slice(1), clients: db.clients })).not.toBe(first);
    const a = { id: "test", value: ["a", "b"] };
    const b = { ...a, value: ["b", "a"] };
    expect(await localSnapshotRevision({ sites: [a] } as unknown as Partial<DatabaseSchema>)).not.toBe(await localSnapshotRevision({ sites: [b] } as unknown as Partial<DatabaseSchema>));
  });
  it("rejects unsupported, missing, duplicate and corrupt data without list fallback", async () => {
    for (const tables of [[], ["sites", "sites"], ["sourceRequirements"], ["applications"]]) expect(() => validateSnapshotRequest(tables as SnapshotTable[])).toThrow();
    const list = vi.fn();
    await expect(createPortalDataRepository({ list } as unknown as LocalStorageAdapter).open()).rejects.toThrow("does not support");
    expect(list).not.toHaveBeenCalled();
    const adapter = new LocalStorageAdapter(db, { getItem: () => "bad json", setItem: () => {}, removeItem: () => {} });
    await expect(adapter.readSnapshot(["sites"])).rejects.toThrow("Snapshot read refused");
    const incomplete = new LocalStorageAdapter(db, { getItem: () => "{}", setItem: () => {}, removeItem: () => {} });
    await expect(incomplete.readSnapshot(["siteEnvironmentLinks"])).rejects.toThrow("Malformed snapshot rows");
    const good = await new LocalStorageAdapter(db).readSnapshot(["sites"]);
    for (const bad of [{ ...good, revision: "invalid" }, { ...good, data: {} }, { ...good, data: { ...good.data, clients: [] } }, { ...good, data: { sites: [db.sites[0], db.sites[0]] } }]) {
      const reader = { readSnapshot: async () => bad } as unknown as LocalStorageAdapter;
      await expect(createPortalDataRepository(reader).open(["sites"])).rejects.toThrow();
    }
    const revision = await createPortalDataRepository(new LocalStorageAdapter(db)).open(["sites"]);
    expect(() => revision.resolveSite("asce")).toThrow("not captured");
  });
  it("filters, orders, pages and detaches local query results", () => {
    const matches = db.siteProducts.filter(row => row.siteId === "asce").sort((a, b) => a.id < b.id ? -1 : 1);
    const page = queryRows<"siteProducts">(db.siteProducts, { filters: { siteId: "asce" }, offset: 1, limit: 2 });
    expect(page.total).toBe(matches.length);
    expect(page.rows).toEqual(matches.slice(1, 3));
    page.rows[0].id = "detached";
    expect(matches[1].id).not.toBe("detached");
    expect(() => queryRows(db.sites, { limit: 0 })).toThrow("Invalid query range");
    expect(() => queryRows(db.sites, { offset: -1 })).toThrow("Invalid query range");
  });
});
