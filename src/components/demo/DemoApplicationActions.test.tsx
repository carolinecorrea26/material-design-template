import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DemoApplicationActions from './DemoApplicationActions';
import type { SavedApplication } from '../../services/applicantSaveService';

const application = { applicationId: 'sample-reference' } as SavedApplication;
describe('Demo application actions', () => {
  it('does not expose application references or demo shortcuts on client sites', () => {
    expect(renderToStaticMarkup(<DemoApplicationActions application={application} siteKey="asce" />)).toBe('');
  });
  it('provides a resume action on the demo site', () => {
    const markup = renderToStaticMarkup(<DemoApplicationActions application={application} siteKey="demo" />);
    expect(markup).toContain('Demo actions');
    expect(markup).toContain('applicationId=sample-reference');
    expect(markup).toContain('site=demo');
  });
});
