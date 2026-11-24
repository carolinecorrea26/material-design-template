/** Global-only application timing, shared by source compilation and the timer. */
export function applicationSessionPolicy(document) {
  const value = id => {
    const entries = document.configurations.filter(entry => entry.id === id);
    if (entries.length !== 1 || entries[0].globalOnly !== true || !Number.isSafeInteger(entries[0].default) || entries[0].default <= 0) throw new Error(`Invalid application session configuration: ${id}`);
    return entries[0].default;
  };
  const inactivityMinutes = value('application-inactivity-minutes');
  const warningMinutes = value('application-session-warning-minutes');
  if (warningMinutes >= inactivityMinutes) throw new Error('Application warning must precede expiry');
  return { inactivityMinutes, warningMinutes };
}
