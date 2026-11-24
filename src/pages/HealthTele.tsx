import ConfiguredHealthPage from '../app/sections/ConfiguredHealthPage';
import { createQuestionFields } from '../config/fields/healthLiFields';

export default function HealthTele() {
  return <ConfiguredHealthPage pageId="health-tele" defaultFields={createQuestionFields} resolveConfigured />;
}
