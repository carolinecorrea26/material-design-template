export type ApplicationSupportIds = { applicationId?: string; confirmationId?: string };

/** Display identifiers only; never include recovery tokens or diagnostic text. */
export function applicationSupportId(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value) ? value : undefined;
}

export function applicationSupportReference({ applicationId, confirmationId }: ApplicationSupportIds) {
  const application = applicationSupportId(applicationId);
  const confirmation = applicationSupportId(confirmationId);
  const id = application ?? confirmation;
  if (!id) return undefined;
  const label = application || /^APP-/i.test(id) ? 'application ID' : 'confirmation ID';
  return { id, instruction: `Please include your ${label} for reference when contacting support:` };
}
