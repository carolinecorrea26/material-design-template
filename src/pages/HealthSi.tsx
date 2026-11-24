import ConfiguredHealthPage from '../app/sections/ConfiguredHealthPage';
import { createAnswerFields } from '../config/fields/healthSiFields';

export default function HealthSi() {
  return <ConfiguredHealthPage pageId="health-si" defaultFields={createAnswerFields} />;
}
