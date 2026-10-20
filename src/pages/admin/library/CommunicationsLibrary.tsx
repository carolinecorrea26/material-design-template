import EmailTemplatesTable from '../../../components/docs/EmailTemplatesTable';
export default function CommunicationsLibrary({ siteKey }: { siteKey: string }) {
  return <EmailTemplatesTable siteId={siteKey === 'all' ? 'demo' : siteKey} />;
}
