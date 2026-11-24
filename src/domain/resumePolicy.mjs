/** Numeric production defaults and overrides shared with the local prototype service. */
export function resumePolicy(document, readValue) {
  const result = {};
  for (const definition of document.configurations) {
    const value = readValue ? readValue(definition) : definition.default;
    if (!definition.policyKey || Object.hasOwn(result, definition.policyKey) || !Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid fresh-start configuration: ${definition.id}`);
    result[definition.policyKey] = value;
  }
  if (result.mfaWarningSeconds >= result.mfaValiditySeconds) throw new Error('MFA warning must precede expiry');
  return result;
}
