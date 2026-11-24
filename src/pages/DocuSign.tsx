import PrototypeHandoffPage from '../components/feedback/PrototypeHandoffPage';
import { advanceApplicationWorkflow } from '../services/applicantSaveService';
import { resolveSiteId } from '../data/activeSite';

const beginSigning = async () => { await advanceApplicationWorkflow(resolveSiteId(), 'start-signing'); };
export default function DocuSign() {
  return <PrototypeHandoffPage pageId="docusign" onEnter={beginSigning} />;
}
