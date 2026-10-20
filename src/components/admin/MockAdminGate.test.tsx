import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { performPasskey } from "../../mock/passkeys";
import MockAdminGate from "./MockAdminGate";
import { mockRequest, type MockAuthStatus } from "../../mock/client";

vi.mock("../../mock/passkeys", () => ({ supportsPasskeys: () => true, performPasskey: vi.fn() }));
vi.mock("../../mock/client", () => ({ mockRequest: vi.fn() }));
beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.clearAllMocks());
const status: MockAuthStatus = { mfaVerified: false, passwordExpired: false, passwordExpiresAt: null, sessionExpiresAt: null, setupNeeded: false, authenticated: false, passwordAccepted: true, recoveryRequired: false, enrollmentNeeded: true, username: "caroline", email: "caroline@example.invalid", mode: "mock" };
const enrollment = { secret: "MANUAL-KEY", uri: "otpauth://totp/test", qrDataUrl: "data:image/png;base64,test", recoveryCodes: ["RECOVERY-ONE"] };

it("resumes setup, displays the locally generated QR and manual key, and withholds admin until verification", async () => {
  let current = status;
  vi.mocked(mockRequest).mockImplementation(async (path) => {
    if (path === "/auth/status") return current;
    if (path === "/auth/enroll") return enrollment;
    if (path === "/auth/verify") { current = { ...status, authenticated: true, enrollmentNeeded: false }; return {}; }
    throw new Error(`Unexpected request: ${path}`);
  });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    expect(node.textContent).not.toContain("Protected admin content");
    await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === "Set up authenticator")!.click());
    expect(node.querySelector("img")?.getAttribute("src")).toBe(enrollment.qrDataUrl);
    expect(node.querySelector("img")?.getAttribute("alt")).toContain("authenticator");
    expect([...node.querySelectorAll("input")].find(input => input.value === enrollment.secret)?.readOnly).toBe(true);
    expect(node.textContent).toContain("RECOVERY-ONE");
    const input = node.querySelector('input[autocomplete="one-time-code"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "123456");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(mockRequest).toHaveBeenCalledWith("/auth/verify", { code: "123456" });
    expect(node.textContent).toContain("Protected admin content");
    expect(node.querySelector("img")).toBeNull();
    expect(node.textContent).not.toContain("RECOVERY-ONE");
  } finally { await act(async () => root.unmount()); }
});

it("offers replacement enrollment after recovery and withholds the verification form until enrollment", async () => {
  vi.mocked(mockRequest).mockResolvedValue({ ...status, recoveryRequired: true });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    expect(node.textContent).toContain("Set up replacement authenticator");
    expect(node.querySelector("form")).toBeNull();
    expect(node.textContent).not.toContain("Protected admin content");
  } finally { await act(async () => root.unmount()); }
});

async function fill(node: HTMLElement, label: string, value: string) {
  const element = [...node.querySelectorAll("label")].find(item => item.textContent?.replace(/\s*\*$/, "") === label);
  const input = node.querySelector<HTMLInputElement>(`#${CSS.escape(element!.htmlFor)}`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("offers forgotten-password reset with authenticator proof and matching masked passwords", async () => {
  vi.mocked(mockRequest).mockImplementation(async (path) => path === "/auth/status" ? { ...status, passwordAccepted: false, enrollmentNeeded: false } : {});
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === "Forgot password?")!.click());
    expect(node.querySelector("h1")!.textContent).toBe("Reset password");
    expect(node.querySelectorAll('input[type="password"]')).toHaveLength(2);
    await fill(node, "Six-digit authenticator code", "123456");
    await fill(node, "New password", "new-password-for-testing");
    await fill(node, "Confirm new password", "mismatched-password");
    await act(async () => node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(node.textContent).toContain("Passwords do not match");
    expect(mockRequest).not.toHaveBeenCalledWith("/auth/password/reset", expect.anything());
    await fill(node, "Confirm new password", "new-password-for-testing");
    await act(async () => node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(mockRequest).toHaveBeenCalledWith("/auth/password/reset", { username: "caroline", newPassword: "new-password-for-testing", code: "123456", method: "totp" });
    expect(node.textContent).toContain("Password updated. Sign in with your new password.");
    expect(node.textContent).not.toContain("Protected admin content");
  } finally { await act(async () => root.unmount()); }
});

it("requires an expired password change after MFA and hides administration", async () => {
  vi.mocked(mockRequest).mockResolvedValue({ ...status, mfaVerified: true, passwordExpired: true, enrollmentNeeded: false });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    expect(node.querySelector("h1")!.textContent).toBe("Change password");
    expect(node.textContent).toContain("Your password has expired");
    expect(node.textContent).not.toContain("Protected admin content");
    expect([...node.querySelectorAll("button")].some(b => b.textContent === "Cancel")).toBe(false);
    await fill(node, "Current password", "previous-password");
    await fill(node, "New password", "new-password-for-testing");
    await fill(node, "Confirm new password", "new-password-for-testing");
    await act(async () => node.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(mockRequest).toHaveBeenCalledWith("/auth/password/change", { currentPassword: "previous-password", newPassword: "new-password-for-testing" });
  } finally { await act(async () => root.unmount()); }
});

it("offers a registered passkey after password entry and verifies it before showing admin", async () => {
  let current = { ...status, enrollmentNeeded: false, passkeyCount: 1, totpEnrolled: true };
  vi.mocked(mockRequest).mockImplementation(async () => current);
  vi.mocked(performPasskey).mockImplementation(async () => { current = { ...current, authenticated: true, mfaVerified: true }; return {}; });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    expect(node.textContent).not.toContain("Protected admin content");
    expect(node.textContent).toContain("Six-digit authenticator code");
    await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === "Sign in with a passkey")!.click());
    expect(performPasskey).toHaveBeenCalledWith(false);
    expect(node.textContent).toContain("Protected admin content");
    expect(node.textContent).not.toContain("Signed in as");
    expect(node.textContent).not.toContain("Change password");
  } finally { await act(async () => root.unmount()); }
});
it("allows passkey-first enrollment and requires saving recovery codes before opening admin", async () => {
  let current = { ...status, passkeyCount: 0, totpEnrolled: false };
  vi.mocked(mockRequest).mockImplementation(async () => current);
  vi.mocked(performPasskey).mockImplementation(async () => { current = { ...current, authenticated: true, mfaVerified: true, enrollmentNeeded: false, passkeyCount: 1 }; return { recoveryCodes: ["SAVE-ME"] }; });
  const node = document.createElement("div"), root = createRoot(node);
  try {
    await act(async () => root.render(<MockAdminGate><div>Protected admin content</div></MockAdminGate>));
    await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === "Set up a device passkey")!.click());
    expect(performPasskey).toHaveBeenCalledWith(true);
    expect(node.textContent).toContain("SAVE-ME");
    expect(node.textContent).not.toContain("Protected admin content");
    await act(async () => [...node.querySelectorAll("button")].find(b => b.textContent === "I saved my recovery codes")!.click());
    expect(node.textContent).toContain("Protected admin content");
    expect(node.textContent).not.toContain("SAVE-ME");
  } finally { await act(async () => root.unmount()); }
});
