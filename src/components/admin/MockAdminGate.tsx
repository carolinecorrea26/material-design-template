import { AccountContext } from '../../admin/AccountContext';
import { supportsPasskeys, performPasskey } from '../../mock/passkeys';
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { mockRequest, type MockAuthStatus, type MockEnrollment } from "../../mock/client";

/** Local mock mode only; server cookies and TOTP verification protect mock admin APIs. */
export default function MockAdminGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MockAuthStatus | null>(null);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("caroline");
  const [passkeyRecovery, setPasskeyRecovery] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [enrollment, setEnrollment] = useState<MockEnrollment | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"login" | "reset" | "change">("login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = async () => setStatus(await mockRequest<MockAuthStatus>("/auth/status"));
  useEffect(() => {
    const check = () => { void mockRequest<MockAuthStatus>("/auth/status").then(next => {
      setStatus(next);
      if (!next.passwordAccepted) { setEnrollment(null); setCode(""); }
    }).catch(e => setError(e.message)); };
    check();
    const timer = window.setInterval(check, 30_000);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", check); };
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try { await fn(); await refresh(); }
    catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // An expired session returns to password sign-in without retaining secrets.
      try {
        const next = await mockRequest<MockAuthStatus>("/auth/status");
        setStatus(next);
        if (!next.passwordAccepted) { setEnrollment(null); setCode(""); setRecovering(false); }
      } catch { /* Keep the actionable request error if the service is unavailable. */ }
    } finally { setBusy(false); }
  };
  const signOut = () => void run(async () => {
    await mockRequest("/auth/logout", {});
    setEnrollment(null); setPassword(""); setCode(""); setRecovering(false); setNewPassword(""); setConfirmation(""); setView("login");
  });
  const signIn = (event: FormEvent) => {
    event.preventDefault();
    if (busy || !password || !status) return;
    if (status.setupNeeded && password !== confirmation) { setError("Passwords do not match"); return; }
    void run(async () => {
      if (status.setupNeeded) await mockRequest<MockEnrollment>("/auth/setup", { username: "caroline", password });
      else await mockRequest("/auth/login", { username: status.setupNeeded ? "caroline" : username.trim().toLowerCase(), password });
      setPassword(""); setConfirmation(""); setNotice("");
    });
  };
  const verify = (event: FormEvent) => {
    event.preventDefault();
    if (busy || (recovering ? !code.trim() : !/^\d{6}$/.test(code))) return;
    void run(async () => {
      await mockRequest(recovering ? "/auth/recover" : "/auth/verify", { code: code.trim() });
      setCode(""); setEnrollment(null); setRecovering(false);
    });
  };
  const switchView = (next: "login" | "reset" | "change") => {
    setView(next); setError(""); setNotice(""); setPassword(""); setNewPassword(""); setConfirmation(""); setCode(""); setRecovering(false);
  };
  const changeRequired = !!status?.mfaVerified && status.passwordExpired;
  const passwordForm = view === "reset" || view === "change" || changeRequired;
  const savePassword = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (newPassword !== confirmation) { setError("Passwords do not match"); return; }
    if (newPassword.length < 12 || newPassword.length > 256) { setError("Use a password of 12–256 characters"); return; }
    void run(async () => {
      if (view === "reset") await mockRequest("/auth/password/reset", { username: username.trim().toLowerCase(), newPassword, code: code.trim(), method: recovering ? "recovery" : "totp" });
      else await mockRequest("/auth/password/change", { currentPassword: password, newPassword });
      setPassword(""); setNewPassword(""); setConfirmation(""); setCode(""); setRecovering(false); setView("login"); setEnrollment(null);
      setNotice("Password updated. Sign in with your new password.");
    });
  };
  if (passkeyRecovery) return <Box sx={{ p: 3, maxWidth: 620, mx: "auto" }}><Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5">Save your recovery codes</Typography><Alert severity="warning">Save these one-use codes offline. They let you recover access if you lose your device.</Alert><Typography component="pre" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{passkeyRecovery.join("\n")}</Typography><Button variant="contained" onClick={() => setPasskeyRecovery(null)}>I saved my recovery codes</Button></Stack></Paper></Box>;
  if (status?.signInDisabled) return <AccountContext.Provider value={{ status, refresh, signOut: () => {}, changePassword: () => {} }}><Alert severity="info">Account sign-in is temporarily disabled while Admin Center and ASCE work is completed.</Alert>{children}</AccountContext.Provider>;
  if (status?.authenticated && !passwordForm) return <AccountContext.Provider value={{ status, refresh, signOut, changePassword: () => switchView("change") }}>{children}</AccountContext.Provider>;
  const needsEnrollment = status?.passwordAccepted && (status.enrollmentNeeded || status.recoveryRequired);
  const canVerify = status?.passwordAccepted && !status.mfaVerified && (!needsEnrollment || enrollment) && (status.totpEnrolled !== false || enrollment || recovering);
  return <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 620, mx: "auto" }}>
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Stack spacing={2}>
      <Typography variant="h5" component="h1">{passwordForm ? view === "reset" ? "Reset password" : "Change password" : status?.setupNeeded ? "Set up your account" : "Admin sign in"}</Typography>
      <Typography>{passwordForm ? view === "reset" ? "Verify your identity with your authenticator app or a saved recovery code." : "Choose a new password to keep your account secure." : "Enter your password, then verify with a passkey or authenticator app."}</Typography>
      {notice && <Alert severity="success">{notice}</Alert>}
      {changeRequired && <Alert severity="warning">Your password has expired. Change it to continue. Passwords expire every 30 days.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!status && <Button disabled={busy} onClick={() => void run(async () => {})}>Connect to account service</Button>}
      {passwordForm && <Stack component="form" spacing={2} onSubmit={savePassword}>
        {view !== "reset" && <TextField label="Current password" type="password" required value={password} autoComplete="current-password" onChange={e => setPassword(e.target.value)} slotProps={{ htmlInput: { maxLength: 256 } }} />}
        {view === "reset" && <>
          <TextField label="Username" value={status?.setupNeeded ? "caroline" : username} onChange={e => setUsername(e.target.value)} slotProps={{ input: { readOnly: !!status?.setupNeeded } }} autoComplete="username" />
          <TextField label={recovering ? "One-use recovery code" : "Six-digit authenticator code"} value={code} required onChange={e => setCode(e.target.value)} autoComplete="one-time-code" slotProps={{ htmlInput: { inputMode: recovering ? "text" : "numeric", maxLength: recovering ? 26 : 6, pattern: recovering ? undefined : "[0-9]{6}" } }} />
          <Button disabled={busy} onClick={() => { setRecovering(!recovering); setCode(""); }}>{recovering ? "Use authenticator code" : "Use a recovery code"}</Button>
          {recovering && <Typography variant="body2">Using a recovery code requires setting up a replacement authenticator after sign-in.</Typography>}
        </>}
        <TextField label="New password" type="password" value={newPassword} required autoComplete="new-password" helperText="Use 12–256 characters. Passwords expire every 30 days." onChange={e => setNewPassword(e.target.value)} slotProps={{ htmlInput: { minLength: 12, maxLength: 256 } }} />
        <TextField label="Confirm new password" type="password" value={confirmation} required autoComplete="new-password" onChange={e => setConfirmation(e.target.value)} slotProps={{ htmlInput: { maxLength: 256 } }} />
        <Button type="submit" variant="contained" disabled={busy || newPassword.length < 12 || !confirmation || (view === "reset" ? !code : !password)}>{view === "reset" ? "Reset password" : "Update password"}</Button>
        {!changeRequired && <Button disabled={busy} onClick={() => switchView("login")}>{view === "reset" ? "Back to sign in" : "Cancel"}</Button>}
      </Stack>}
      {!passwordForm && status && !status.passwordAccepted && <Stack component="form" spacing={2} onSubmit={signIn}>
        <TextField label="Username" value={status?.setupNeeded ? "caroline" : username} onChange={e => setUsername(e.target.value)} slotProps={{ input: { readOnly: !!status?.setupNeeded } }} autoComplete="username" />
        <TextField label={status.setupNeeded ? "Choose a password" : "Password"} type="password" value={password}
          helperText={status.setupNeeded ? "Use 12–256 characters." : undefined} required
          autoComplete={status.setupNeeded ? "new-password" : "current-password"}
          slotProps={{ htmlInput: { minLength: status.setupNeeded ? 12 : undefined, maxLength: 256 } }}
          onChange={e => setPassword(e.target.value)} />
        {status.setupNeeded && <TextField label="Confirm password" type="password" value={confirmation} required autoComplete="new-password" onChange={e => setConfirmation(e.target.value)} slotProps={{ htmlInput: { maxLength: 256 } }} />}
        <Button disabled={busy || !password || (status.setupNeeded && (password.length < 12 || !confirmation))} variant="contained" type="submit">
          {status.setupNeeded ? "Create account" : "Continue"}
        </Button>
        {!status.setupNeeded && <Button disabled={busy} onClick={() => switchView("reset")}>Forgot password?</Button>}
      </Stack>}
      {!passwordForm && status?.passwordAccepted && !status.mfaVerified && (needsEnrollment || !!status.passkeyCount) && <Stack spacing={1}>
        <Typography variant="h6">{needsEnrollment ? "Choose a sign-in method" : "Verify your sign-in"}</Typography>
        <Button variant="outlined" disabled={busy || !supportsPasskeys()} onClick={() => void run(async () => {
          const result = await performPasskey(!!needsEnrollment);
          setEnrollment(null); setCode("");
          if (result.recoveryCodes?.length) setPasskeyRecovery(result.recoveryCodes);
        })}>{needsEnrollment ? "Set up a device passkey" : "Sign in with a passkey"}</Button>
        <Typography variant="body2" color="text.secondary">Use your device’s fingerprint, face recognition, or screen-lock PIN.{!supportsPasskeys() && " Passkeys are unavailable in this browser; use the authenticator option below."}</Typography>
      </Stack>}
      {!passwordForm && needsEnrollment && !enrollment && <>
        <Alert severity="warning">{status.recoveryRequired ? "Recovery accepted. Set up a replacement sign-in method to restore access." : "Set up a passkey or authenticator app to access administration."}</Alert>
        <Button disabled={busy} variant="contained" onClick={() => void run(async () => {
          setEnrollment(await mockRequest<MockEnrollment>("/auth/enroll", {})); setCode(""); setRecovering(false);
        })}>{status.recoveryRequired ? "Set up replacement authenticator" : "Set up authenticator"}</Button>
      </>}
      {!passwordForm && enrollment && <>
        <Typography variant="h6">Set up your authenticator app</Typography>
        <Typography>In your authenticator app, add an account and scan this QR code.</Typography>
        <Box component="img" src={enrollment.qrDataUrl} alt="QR code to add your Portal account to an authenticator app"
          sx={{ width: 280, maxWidth: "100%", height: "auto", alignSelf: "center", bgcolor: "#fff" }} />
        <TextField label="Manual setup key" value={enrollment.secret} helperText="If you cannot scan the code, enter this key as a time-based account."
          slotProps={{ input: { readOnly: true } }} />
        <Alert severity="warning">Save these one-use recovery codes offline before continuing. They are shown only during setup.</Alert>
        <Typography component="pre" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{enrollment.recoveryCodes.join("\n")}</Typography>
      </>}
      {!passwordForm && canVerify && <Stack component="form" spacing={2} onSubmit={verify}>
        <TextField label={recovering ? "One-use recovery code" : "Six-digit authenticator code"} value={code} required
          onChange={e => setCode(e.target.value)} autoComplete="one-time-code"
          helperText={recovering ? "Use a saved recovery code to replace your authenticator." : "Enter the current code shown in your authenticator app."}
          slotProps={{ htmlInput: { inputMode: recovering ? "text" : "numeric", maxLength: recovering ? 26 : 6, pattern: recovering ? undefined : "[0-9]{6}" } }} />
        <Button disabled={busy || (recovering ? !code.trim() : !/^\d{6}$/.test(code))} variant="contained" type="submit">
          {recovering ? "Recover account" : enrollment ? "Verify and finish setup" : "Sign in"}
        </Button>
        {!enrollment && <Button disabled={busy} onClick={() => { setRecovering(!recovering); setCode(""); setError(""); }}>
          {recovering ? "Use authenticator code" : "Use a recovery code"}
        </Button>}
      </Stack>}
      {!passwordForm && status?.passwordAccepted && !!status.passkeyCount && !status.totpEnrolled && !needsEnrollment && !recovering && <Button disabled={busy} onClick={() => setRecovering(true)}>Use a recovery code</Button>}
      <Typography variant="caption" color="text.secondary">Local preview · Account recovery uses your authenticator or recovery codes.</Typography>
      {status?.passwordAccepted && <Button disabled={busy} onClick={signOut}>Cancel and sign out</Button>}
    </Stack></Paper>
  </Box>;
}
