import application from '../../../requirements/global/application.json';
import type { MockEmailType } from "../../utils/mockEmail";

export type EmailFlowId = "Consumer" | "Advisor" | "Resume";

export type EmailTemplateRow = {
  id: string;
  flow: EmailFlowId;
  type: MockEmailType;
  recipient: 'Advisor' | 'Applicant';
  title: string;
  description: string;
  whenSent: string;
  notes: string;
  /** True when this email includes the "Questions? We're here to help" contact box, i.e. is affected by ClientConfig.emailSupport. */
  usesSupportBox: boolean;
};

/**
 * Every mock email across the consumer, advisor, and resume flows, in one flat
 * list — the Flow column differentiates them instead of separate per-flow
 * tables. Shared by GlobalEmailTemplatesPanel and ClientEmailTemplatesPanel.
 */
/** Email metadata is authored alongside the canonical global email definitions. */
export const emailTemplateRows: EmailTemplateRow[] = application.records.emailTemplates.map(template => ({
  ...template.definition.library,
  flow: template.definition.library.flow as EmailFlowId,
  type: template.key as MockEmailType,
  recipient: template.definition.recipient as EmailTemplateRow['recipient'],
  usesSupportBox: 'supportComponent' in template.definition && template.definition.supportComponent === 'site-support',
}));
