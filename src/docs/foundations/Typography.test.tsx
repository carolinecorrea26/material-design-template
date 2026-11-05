import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../../app/theme';
import meta, { Headings, BodyAndSupportingText, ApplicationTitlesAndLabels } from './Typography.stories';

it.each([
  ['headings', Headings, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']],
  ['body', BodyAndSupportingText, ['body1 · Paragraph', 'body2 · Supporting copy', 'subtitle1', 'subtitle2', 'caption', 'overline', 'button']],
  ['application', ApplicationTitlesAndLabels, ['Your preferred contact', 'Life insurance', 'Member information', 'Business information', 'Group Term Life', 'Est. cost']],
] as const)('renders the actual %s story with the application theme', (_, story, expected) => {
  const Component = meta.component;
  const html = renderToStaticMarkup(<ThemeProvider theme={createAppTheme()}><Component {...story.args} /></ThemeProvider>);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const text of expected) expect(doc.body.textContent).toContain(text);
  expect(doc.querySelector('.MuiCard-root')).not.toBeNull();
  expect(doc.querySelector('select, [role="combobox"]')).toBeNull();
});
