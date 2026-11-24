export type ApplicationWorkflowStage = 'preparing' | 'applicant' | 'revising' | 'signing' | 'submitted';
export function applicationLifecycle(stage: ApplicationWorkflowStage, advisorFlow?: boolean): { reviewSubmitted: boolean; advisorApplicantFlow: boolean; resumePage: 'eligibility' | 'review' | 'docusign' };
export const applicationStateChanged: string;
