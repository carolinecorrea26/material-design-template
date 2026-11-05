import type { Meta, StoryObj } from '@storybook/react-vite';
import ReceiptApplicationSummary from './ReceiptApplicationSummary';
import ReceiptDecisions from './ReceiptDecisions';
import ReceiptCoverageDecision from './ReceiptCoverageDecision';
import SiteSupport from '../layout/SiteSupport';
import EstimatedRate from '../coverage/EstimatedRate';
import { getContent } from '../../content';
import { getDecisionStatus, type QdDecisionResult } from '../../utils/coverageDecisions';
const meta = { title: 'Components/Pages/Receipt/Sections/Decision section', component: ReceiptDecisions, parameters: { standalone: true, layout: 'fullscreen', catalog: { position: 1 } } } satisfies Meta<typeof ReceiptDecisions>;
export default meta;
function Example({ results = ['conditionally-approved'] as QdDecisionResult[], type = 'QD', empty = false }: { results?: QdDecisionResult[]; type?: 'QD' | 'FUW' | 'UNRESOLVED'; empty?: boolean }) {
 const content = getContent().receipt;
 const items = empty ? [] : results.map((result, i) => ({ id: result+i, productName: i ? 'Group 20-Year Level Term Life Insurance' : 'Group Term Life Insurance', applicantLabel: i ? 'Your spouse' : 'You', applicant: i ? 'spouse' as const : 'member' as const, requestedAmount: 100000, estimatedPayment: <EstimatedRate appearance="summary" amount={i ? 120 : 12} suffix={i ? '/yr' : '/mo'} />, paymentMethod: i ? 'Bill me' : 'Bank account' }));
 return <ReceiptDecisions title={content.coverageDecisions.title} description={content.coverageDecisions.description} receipt={<ReceiptApplicationSummary items={items} showApplicant={items.some(item => item.applicant !== 'member')} />} support={<SiteSupport contact={{ name: 'Example administrator', acronym: 'Example', website: 'example.org', hideInEmail: false, phone: '800-555-0100', email: 'support@example.org' }} />}>
 {empty ? content.coverageDecisions.noSelectionsMessage : results.map((result, i) => <ReceiptCoverageDecision key={result+i} productName={items[i].productName} quickDecision={type === 'QD'} status={getDecisionStatus({ underwritingType: type, decisionResult: result })} tone={result === 'conditionally-approved' && type === 'QD' ? 'success' : result === 'soft-declined' || type === 'UNRESOLVED' ? 'warning' : 'primary'} applicantLabel={items[i].applicantLabel} applicant={items[i].applicant} showApplicant={items.some(item => item.applicant !== 'member')} />)}
 </ReceiptDecisions>;
}
export const ConditionallyApproved: StoryObj = { render: () => <Example /> };
export const StandardReview: StoryObj = { render: () => <Example type="FUW" results={['referred']} /> };
export const Referred: StoryObj = { render: () => <Example results={['referred']} /> };
export const UnableToOffer: StoryObj = { render: () => <Example results={['soft-declined']} /> };
export const ServiceUnavailable: StoryObj = { render: () => <Example results={['database-unavailable']} /> };
export const RequirementsUnresolved: StoryObj = { render: () => <Example type="UNRESOLVED" results={['referred']} /> };
export const MixedDecisions: StoryObj = { render: () => <Example results={['conditionally-approved', 'referred', 'soft-declined', 'database-unavailable']} /> };
export const NoSelections: StoryObj = { render: () => <Example empty /> };
