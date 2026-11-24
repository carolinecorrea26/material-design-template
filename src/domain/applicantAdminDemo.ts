import definition from '../../requirements/global/admin/applicant-admin.json';
import fixtures from '../../requirements/global/prototype-fixtures/applicant-admin.json';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
export { definition as applicantAdminDefinition };
export const applicantAdminExamples = fixtures.applications;
const key = (id: string) => `applicant-admin-demo:${id}`;
export function readApplicantAdminAnswers(id: string): ApplicationFormValues {
  if (!applicantAdminExamples.some(item => item.id === id)) return {};
  try { return JSON.parse(sessionStorage.getItem(key(id)) ?? '{}'); } catch { return {}; }
}
export function canUpdateApplicantAdminExample(id: string) { return applicantAdminExamples.find(item => item.id === id)?.status === 'Approved'; }
export function saveApplicantAdminAnswers(id: string, values: ApplicationFormValues) {
  if (!canUpdateApplicantAdminExample(id)) throw new Error('Details can be updated only after approval.');
  sessionStorage.setItem(key(id), JSON.stringify(values));
}
