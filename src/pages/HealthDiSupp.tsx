import ConfiguredHealthPage from '../app/sections/ConfiguredHealthPage';
import { createAnswerFields } from '../config/fields/healthDiFields';

export default function HealthDiSupp() {
  return <ConfiguredHealthPage pageId="health-di-supp" defaultFields={createAnswerFields} resolveConfigured />;
}
