/** Global workflow presentation for the local application simulation. The saved
 * workflow stage owns recovery placement and editing locks. */
export function applicationLifecycle(stage, advisorFlow = false) {
  return {
    reviewSubmitted: stage === 'signing' || stage === 'submitted',
    advisorApplicantFlow: advisorFlow,
    resumePage: stage === 'signing' ? 'docusign' : advisorFlow ? 'review' : 'eligibility',
  };
}
export const applicationStateChanged = 'application:state-changed';
