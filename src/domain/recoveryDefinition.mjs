/** Validate the shared source before either browser or Node consumers project it. */
export function validateRecoveryDefinition(definition, content) {
  const requiredSlots = ['indicator', 'title', 'message', 'guidance', 'actions', 'support'];
  if (!definition || Object.keys(definition.families).sort().join(',') !== 'error,expired,maintenance' ||
      definition.template?.component !== 'ApplicationErrorState' || definition.template.header !== 'recovery' || definition.template.footer !== 'shared' ||
      !Number.isFinite(definition.template.maxWidth) || definition.template.maxWidth <= 0 ||
      !Number.isFinite(definition.template.indicatorSize) || definition.template.indicatorSize <= 0 ||
      !Number.isFinite(definition.template.messageMaxWidth) || definition.template.messageMaxWidth <= 0 ||
      definition.template.sections?.length !== requiredSlots.length || requiredSlots.some(slot => !definition.template.sections.includes(slot))) throw new Error('Invalid shared recovery template');
  for (const [key, state] of Object.entries(definition.states)) {
    if (state.placement === 'page' && !Object.hasOwn(definition.families, state.family)) throw new Error(`Missing recovery family: ${key}`);
    if (!Array.isArray(state.actions) || state.actions.some(action => !Object.hasOwn(definition.actions, action))) throw new Error(`Invalid recovery action: ${key}`);
    for (const reference of Object.values(state.content)) if (typeof content[reference] !== 'string') throw new Error(`Missing recovery content: ${reference}`);
  }
  for (const state of Object.values(definition.codeStates)) if (!Object.hasOwn(definition.states, state)) throw new Error(`Unknown recovery state: ${state}`);
}
