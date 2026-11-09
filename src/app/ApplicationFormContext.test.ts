import { readFileSync } from "node:fs";
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ApplicationFormProvider, applicationStorageKey, normalizeChildValues, useApplicationForm } from "./ApplicationFormContext";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { readSavedApplication, type SavedApplication } from "../services/applicantSaveService";
import { mockRequest } from "../mock/client";

vi.mock("../mock/client", () => ({ mockRequest: vi.fn() }));
let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove(); root = undefined; container = undefined;
  installPrototypeLibrary(null);
  sessionStorage.clear();
  vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks();
});

it("migrates legacy child answers without overwriting newer answers", () => {
  const values = { children: [{ firstName: "Old", "child-first-name": "New", lastName: "Name", birthDate: "2015-01-01", gender: "female", fullTimeStudent: "yes", honorablyDischargedServiceMember: "no", other: "kept" }] };
  expect(normalizeChildValues(values)).toEqual({ children: [{ "child-first-name": "New", "child-last-name": "Name", "child-birth-date": "2015-01-01", "child-gender": "female", "child-full-time-student": "yes", "child-honorably-discharged-service-member": "no", other: "kept" }] });
  expect(values.children[0].firstName).toBe("Old");
});

it("keeps cached email drafts local until Membership submission, then saves only submitted pages", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv("VITE_MOCK_PLATFORM_ENABLED", "true");
  const catalog = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, "asce", "test:autosave-start"));
  const saved: SavedApplication = { mode: "mock", applicationId: "application-1", siteKey: "asce", recipient: "member@example.invalid", revision: "test:autosave-start", expiresAt: Date.now() + 60000, writeCapability: "write-1", requiresRevalidation: false };
  vi.mocked(mockRequest).mockResolvedValue(saved);
  sessionStorage.setItem(applicationStorageKey("asce"), JSON.stringify({ email: saved.recipient, "first-name": "Draft" }));
  let context!: ReturnType<typeof useApplicationForm>;
  function Probe() {
    const current = useApplicationForm();
    useEffect(() => { context = current; }, [current]);
    return null;
  }
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  const render = async () => act(async () => { root!.render(createElement(ApplicationFormProvider, { children: createElement(Probe) })); });
  await render();
  expect(context.values.email).toBe(saved.recipient);
  expect(mockRequest).not.toHaveBeenCalled();
  await act(async () => context.setPageValues({ "first-name": "Edited" }));
  expect(JSON.parse(sessionStorage.getItem(applicationStorageKey("asce"))!)["first-name"]).toBe("Edited");
  expect(mockRequest).not.toHaveBeenCalled();
  await act(async () => { await context.saveApplication!(context.values); });
  expect(mockRequest).not.toHaveBeenCalled();
  expect(readSavedApplication("asce")).toBeNull();

  await act(async () => { await context.saveApplication!({ ...context.values, membership: "yes" }, "membership"); });
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(readSavedApplication("asce")?.applicationId).toBe(saved.applicationId);
  await act(async () => context.setPageValues({ "first-name": "Later edit" }));
  expect(mockRequest).toHaveBeenCalledTimes(1);
  await act(async () => { await context.saveApplication!(context.values); });
  expect(mockRequest).toHaveBeenCalledTimes(2);

  // Reloading a draft or an existing saved application must not submit it again.
  await act(async () => root!.unmount()); root = createRoot(container);
  await render();
  expect(mockRequest).toHaveBeenCalledTimes(2);
  expect(context.values["first-name"]).toBe("Later edit");
  await act(async () => context.resetValues());
  await act(async () => { await context.saveApplication!({ email: saved.recipient }); });
  expect(mockRequest).toHaveBeenCalledTimes(2);
  expect(readSavedApplication("asce")).toBeNull();
});
