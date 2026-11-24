import notificationDefinitions from '../../requirements/global/tutorials/email-notifications.json';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';

/** Group existing template records; the template owner retains delivery timing. */
export const tutorialNotifications = {
  ...notificationDefinitions,
  types: notificationDefinitions.types.map(group => ({ ...group, emails: group.emails.map(email => {
    const template = emailTemplateRows.find(row => row.id === email.templateId);
    if (!template) throw new Error(`Unknown tutorial email template: ${email.templateId}`);
    if (template.recipient !== email.recipient) throw new Error(`Incorrect tutorial email recipient: ${email.templateId}`);
    return { ...email, template };
  }) })),
};
