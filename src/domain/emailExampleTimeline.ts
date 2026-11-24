import examples from '../../requirements/global/prototype-fixtures/email-metadata.json';

export type EmailExampleKind = keyof typeof examples.timelines;
const dayMs = 24 * 60 * 60 * 1000;

/** Fictional event ages are example data; retention always uses the shared policy. */
export function emailExampleTimeline(kind: EmailExampleKind, retentionDays: number, now = Date.now()) {
  const example = examples.timelines[kind] as { savedDaysAgo?: number; sentDaysAgo?: number; editRequestedDaysAgo?: number; deletedDaysAgo?: number; sentAfterSaveDays?: number };
  const deletedAt = example.deletedDaysAgo !== undefined ? now - example.deletedDaysAgo * dayMs : undefined;
  const savedAt = deletedAt !== undefined ? deletedAt - retentionDays * dayMs : now - (example.savedDaysAgo ?? 0) * dayMs;
  return {
    savedAt,
    expiresAt: savedAt + retentionDays * dayMs,
    sentAt: example.sentDaysAgo !== undefined ? now - example.sentDaysAgo * dayMs : savedAt + (example.sentAfterSaveDays ?? 0) * dayMs,
    editRequestedAt: now - (example.editRequestedDaysAgo ?? 0) * dayMs,
    deletedAt,
  };
}
