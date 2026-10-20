import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { PortalDataProvider, usePortalData, usePortalSite } from "./PortalDataProvider";
import { createPortalDataRepository, type PortalDataRepository, type PortalRevision } from "../repositories/portalDataRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createMigrationDatabase } from "../migration/fixtures";
let revision: PortalRevision;
beforeAll(async () => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  revision = await createPortalDataRepository(new LocalStorageAdapter(createMigrationDatabase())).open();
});
function deferred() {
  let resolve!: (value: PortalRevision) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<PortalRevision>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function Probe() {
  const data = usePortalData();
  const site = usePortalSite("asce");
  return <><output>{data.status === "ready" ? data.revision.query("sites").revision : data.status === "error" ? data.error.message : data.status}</output><output>{site.status === "ready" ? site.revision : site.status}</output><button onClick={data.refresh}>Refresh</button></>;
}
it("shares one revision, clears stale results during refresh, and propagates failures", async () => {
  const first = deferred(), second = deferred(), third = deferred();
  const repository: PortalDataRepository = { open: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise) };
  const node = document.createElement("div");
  const root = createRoot(node);
  try {
    await act(async () => root.render(<PortalDataProvider repository={repository}><Probe /></PortalDataProvider>));
    expect(node.querySelector("output")!.textContent).toBe("loading");
    await act(async () => first.resolve(revision));
    expect([...node.querySelectorAll("output")].map(item => item.textContent)).toEqual([revision.revision, revision.revision]);
    await act(async () => node.querySelector("button")!.click());
    expect(node.querySelector("output")!.textContent).toBe("loading");
    await act(async () => node.querySelector("button")!.click());
    await act(async () => second.resolve(revision));
    expect(node.querySelector("output")!.textContent).toBe("loading");
    await act(async () => third.reject(new Error("transport refused")));
    expect(node.querySelector("output")!.textContent).toBe("transport refused");
  } finally { await act(async () => root.unmount()); }
});
it("ignores an earlier repository response after replacing the repository", async () => {
  const old = deferred(), fresh = deferred();
  const oldRepository = { open: vi.fn(() => old.promise) };
  const newRepository = { open: vi.fn(() => fresh.promise) };
  const node = document.createElement("div");
  const root = createRoot(node);
  try {
    await act(async () => root.render(<PortalDataProvider repository={oldRepository}><Probe /></PortalDataProvider>));
    await act(async () => root.render(<PortalDataProvider repository={newRepository}><Probe /></PortalDataProvider>));
    await act(async () => old.resolve(revision));
    expect(node.querySelector("output")!.textContent).toBe("loading");
    await act(async () => fresh.resolve(revision));
    expect(node.querySelector("output")!.textContent).toBe(revision.revision);
  } finally { await act(async () => root.unmount()); }
});
