import { requirementText } from './requirementContent';

export type ResumeFailure = 'link' | 'mfa-expired' | 'code-expired' | 'code-replaced' | 'code-invalid' | 'link-limit' | 'code-limit' | 'attempts-locked' | 'technical';
export type ResumePageIssue = { kind: 'link' | 'mfa-expired' | 'link-limit' | 'code-limit' | 'attempts-locked'; retryAt?: number; recipient?: string };
const failures: Record<string, ResumeFailure> = {
  RESUME_LINK_INVALID: 'link', RESUME_MFA_EXPIRED: 'mfa-expired', RESUME_CODE_EXPIRED: 'code-expired',
  RESUME_CODE_REPLACED: 'code-replaced', RESUME_CODE_INVALID: 'code-invalid', RESUME_LINK_REQUEST_LIMIT: 'link-limit',
  RESUME_CODE_REQUEST_LIMIT: 'code-limit', RESUME_ATTEMPTS_LOCKED: 'attempts-locked',
};
export function resumeFailure(error: unknown): ResumeFailure {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  return typeof code === 'string' ? failures[code] ?? 'technical' : 'technical';
}
export function resumePageIssue(error: unknown, recipient?: string): ResumePageIssue | null {
  const kind = resumeFailure(error);
  if (!['link', 'mfa-expired', 'link-limit', 'code-limit', 'attempts-locked'].includes(kind)) return null;
  const retryAt = error && typeof error === 'object' && 'retryAt' in error && typeof error.retryAt === 'number' && Number.isSafeInteger(error.retryAt) ? error.retryAt : undefined;
  return { kind: kind as ResumePageIssue['kind'], ...(retryAt ? { retryAt } : {}), ...(recipient ? { recipient } : {}) };
}
export function resumeIssueMessage(issue: ResumePageIssue, secondsLeft?: number | null) {
  if (issue.kind === 'link') return requirementText('recovery.link-expired.message');
  if (issue.kind === 'mfa-expired') return requirementText('recovery.session-expired.message');
  return requirementText(`resume.error.${issue.kind}`, { minutes: String(Math.max(1, Math.ceil((secondsLeft ?? 0) / 60))) });
}
export function resumeFailureMessage(error: unknown) {
  const kind = resumeFailure(error);
  return requirementText(kind === 'code-invalid' ? 'resume.error.invalid-code' : kind === 'code-replaced' ? 'resume.error.code-replaced' : 'resume.error.technical');
}
