import { emailBodyTextStyle } from '../../utils/emailTypography';
import controlPresentation from '../../../requirements/global/presentation-tokens.json';
import { Fragment, useId, type CSSProperties, type ReactNode } from 'react';
import { Alert, AlertTitle, Link } from '@mui/material';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import { useTheme } from '@mui/material/styles';
import { buildContent } from '../../content';
import { resolveSiteId } from '../../data/activeSite';
import { resolveSiteSupportContact, resolveApplicationSupportReference, supportPhoneHref, supportWebsiteHref, type SiteSupportContact } from '../../data/siteSupport';
import { supportReference } from '../../domain/recoveryIncident';
import type { ApplicationSupportIds } from '../../domain/applicationSupportReference';
import { emailAlertPresentation, emailAlertTitleStyle } from '../../utils/emailAlertPresentation';
import type { SiteId } from '../../domain/sites';

/** Shared support content and MUI presentation for pages and email previews. */
export default function SiteSupport({ siteId = resolveSiteId(), contact = resolveSiteSupportContact(siteId), reference, applicationId, confirmationId, presentation = 'page' }: ApplicationSupportIds & {
  siteId?: SiteId;
  contact?: SiteSupportContact;
  reference?: string;
  presentation?: 'page' | 'email';
}) {
  const headingId = useId();
  const theme = useTheme();
  const { palette } = theme;
  const emailPresentation = presentation === 'email' ? emailAlertPresentation(theme, 'info') : undefined;
  const copy = buildContent(siteId).shared.support;
  const applicationReference = resolveApplicationSupportReference(siteId, { applicationId, confirmationId });
  const safeReference = applicationReference?.id ?? supportReference(reference);
  const emailSubject = safeReference ? `?subject=${encodeURIComponent(copy.emailSubject.replace('{{reference}}', safeReference))}` : '';
  const paragraph: CSSProperties = { margin: '0 0 10px', ...(presentation === 'email' ? emailBodyTextStyle : { fontSize: 14 }), lineHeight: presentation === 'email' ? emailBodyTextStyle.lineHeight : 1.5 };
  // Email clients need inline HTML; page links use the configured MUI component.
  const emailLink: CSSProperties = { color: palette.primary.main, fontWeight: controlPresentation.controls.fontWeight, textDecoration: theme.components?.MuiLink?.defaultProps?.underline === 'always' ? 'underline' : 'none' };
  const supportLink = (href: string, children: ReactNode, label?: string, external = false) => presentation === 'page'
    ? <Link href={href} aria-label={label} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{children}</Link>
    : <a href={href} aria-label={label} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} style={emailLink}>{children}</a>;
  const iconStyle: CSSProperties = { width: 18, height: 18, fill: 'currentColor', fontSize: 18, verticalAlign: 'middle', marginRight: 8 };
  const technicalCopy = copy.technicalTitle.split('{{emailLink}}');
  const details = <>
    {applicationReference && <p style={paragraph}>{applicationReference.kind === 'application' ? copy.applicationReference : copy.confirmationReference}{' '}<strong>{applicationReference.id}</strong></p>}
    {contact.name && <p style={{ ...paragraph, color: palette.text.secondary }}>{contact.name} {copy.administratorSuffix}</p>}
    {contact.phone && <p style={paragraph}><PhoneRounded aria-hidden="true" style={iconStyle} />{supportLink(supportPhoneHref(contact.phone), contact.phone, `${copy.callLabel} ${contact.phone}`)}</p>}
    {contact.email && <p style={paragraph}><EmailRounded aria-hidden="true" style={iconStyle} />{supportLink(`mailto:${contact.email}${emailSubject}`, contact.email, `${copy.emailLabel} ${contact.email}`)}</p>}
    {contact.website && <p style={paragraph}><LanguageRounded aria-hidden="true" style={iconStyle} />{supportLink(supportWebsiteHref(contact.website), contact.website, `${copy.websiteLabel} ${contact.website}`, true)}</p>}
    {presentation === 'page' && <div style={{ borderTop: `1px solid ${palette.divider}`, marginTop: 18, paddingTop: 18 }}>
      <p style={{ ...paragraph, marginBottom: 0 }}>{technicalCopy.map((part, index) => <Fragment key={index}>{index > 0 && supportLink(`mailto:${copy.technicalEmailAddress}${emailSubject}`, copy.technicalEmailLabel)}{part}</Fragment>)}</p>
    </div>}
  </>;
  return <section aria-labelledby={headingId} style={{ width: '100%' }}>
    <Alert severity="info" icon={false} data-component="site-support" {...(emailPresentation ? { ...emailPresentation, style: { ...emailPresentation.style, marginTop: 28 } } : {})} sx={{ width: '100%', overflowWrap: 'anywhere' }}>
      <AlertTitle id={headingId} component="h2" style={presentation === 'email' ? emailAlertTitleStyle(theme) : undefined}>{copy.title}</AlertTitle>
      {details}
    </Alert>
  </section>;
}
