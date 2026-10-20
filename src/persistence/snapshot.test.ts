import { beforeAll, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LocalStorageAdapter } from "./localAdapter";
import { SupabaseAdapter } from "./supabaseAdapter";
import { snapshotSchemaSql } from "./snapshotSchema";
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
  it("matches the additive SQL migration and excludes raw/operational tables", () => {
    const sql = snapshotSchemaSql();
    expect(readFileSync("supabase/migrations/202610120006_configuration_boundary.sql", "utf8")).toContain(sql.replace("create function public.portal_read_snapshot", "create or replace function public.portal_read_snapshot"));
    expect(sql).toContain("stable security invoker");
    expect(sql).toContain("set row_security = on");
    expect(sql).not.toMatch(/security definer|create policy|grant select|source_requirements|site_configurations|applications/);
  });
});
describe("Supabase transport", () => {
  it("uses exactly one RPC and preserves nested JSON keys", async () => {
    const from = vi.fn();
    const rpc = vi.fn(async () => ({ data: { formatVersion: 1, consistency: "single-read", revision: `postgres:v1:sha256:${"a".repeat(64)}`, data: { sites: [{ id: "site", client_id: "client", definition: { some_key: 1 } }] } }, error: null }));
    const adapter = new SupabaseAdapter({ from, rpc } as unknown as SupabaseClient);
    const snapshot = await adapter.readSnapshot(["sites"]);
    expect(snapshot.data.sites[0]).toEqual({ id: "site", clientId: "client", definition: { some_key: 1 } });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("portal_read_snapshot", { requested_tables: ["sites"] });
    expect(from).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: null as never, error: new Error("denied") as never });
    await expect(adapter.readSnapshot(["sites"])).rejects.toThrow("denied");
  });
  it("pages past server row caps with deterministic order and exact counts", async () => {
    const raw = Array.from({ length: 1101 }, (_, i) => ({ id: String(i).padStart(4, "0"), client_id: "client" }));
    const ranges: number[][] = [];
    const orders: string[] = [];
    const chain = { order: (key: string) => { orders.push(key); return chain; }, range: async (start: number, end: number) => { ranges.push([start, end]); return { data: raw.slice(start, Math.min(end + 1, start + 200)), count: raw.length, error: null }; } };
    const select = vi.fn(() => chain);
    const adapter = new SupabaseAdapter({ from: () => ({ select }) } as unknown as SupabaseClient);
    const rows = await adapter.list("sites");
    expect(rows).toHaveLength(1101);
    expect(rows[1100]).toEqual({ id: "1100", clientId: "client" });
    expect(ranges.map(range => range[0])).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(orders).toEqual(Array(6).fill("id"));
    expect(select).toHaveBeenCalledWith("*", { count: "exact" });
  });
  it("fails incomplete pagination and applies scalar filters before ranges", async () => {
    const calls: unknown[] = [];
    const chain = { eq: (...args: unknown[]) => { calls.push(args); return chain; }, is: (...args: unknown[]) => { calls.push(args); return chain; }, order: (...args: unknown[]) => { calls.push(args); return chain; }, range: async (...args: unknown[]) => { calls.push(args); return { data: [], count: 1, error: null }; } };
    const adapter = new SupabaseAdapter({ from: () => ({ select: () => chain }) } as unknown as SupabaseClient);
    await adapter.query("siteProducts", { filters: { siteId: "asce", enabled: true }, orderBy: "productKey", offset: 3, limit: 5 });
    expect(calls).toEqual([["site_id", "asce"], ["enabled", true], ["product_key", { ascending: true, nullsFirst: false }], ["id", { ascending: true }], [3, 7]]);
    await expect(adapter.list("sites")).rejects.toThrow("Incomplete paginated response");
  });
});
