import { build, createServer } from 'vite';
import { JSDOM } from 'jsdom';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
// Initialize Emotion in server-rendering mode before exposing the DOM shims.
import '@emotion/react';
import '@emotion/styled';

// Read-only export: metadata and previews use the same modules as Portal Library.
const siteId = process.argv[2] ?? 'asce';
const dom = new JSDOM('', { url: `https://portal.example.test/?site=${encodeURIComponent(siteId)}` });
for (const key of ['window', 'document', 'localStorage', 'sessionStorage']) globalThis[key] = dom.window[key];
// The read-only exporter must not replace a running dev server's optimized deps.
const cacheDir = await mkdtemp(resolve(tmpdir(), 'portal-email-export-'));
const server = await createServer({ cacheDir, server: { middlewareMode: true, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom', define: { 'import.meta.env.VITE_MOCK_PLATFORM_ENABLED': 'false' } });
try {
  const { installPrototypeLibrary, resolvePrototypeLibrary } = await server.ssrLoadModule('/src/domain/prototypeLibrary.ts');
  const catalog = JSON.parse(await readFile('public/catalog/portal.json', 'utf8'));
  const library = resolvePrototypeLibrary(catalog.data, siteId, 'email-html-export');
  installPrototypeLibrary(library);
  const { emailTemplateRows } = await server.ssrLoadModule('/src/components/docs/emailTemplateRows.ts');
  const { getMockEmailSamples } = await server.ssrLoadModule('/src/utils/mockEmail.ts');
  const samples = getMockEmailSamples(siteId);
  const publicRoot = resolve('public');
  const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
  async function embedImages(html) {
    for (const match of [...html.matchAll(/src="(\/[^"?#]+)"/g)]) {
      const path = resolve(publicRoot, '.' + match[1]);
      if (!path.startsWith(publicRoot + sep) || !mime[extname(path)]) throw new Error(`Unsupported email image: ${match[1]}`);
      const data = await readFile(path);
      html = html.replaceAll(match[0], `src="data:${mime[extname(path)]};base64,${data.toString('base64')}"`);
    }
    return html;
  }
  const previews = await Promise.all(emailTemplateRows.map(async row => {
    const sample = samples.find(item => item.type === row.type);
    if (!sample) throw new Error(`Missing Library preview: ${row.type}`);
    return { ...sample, html: await embedImages(sample.html) };
  }));
  // The export mounts the canonical Library table, including its existing modal,
  // Mockup/HTML tabs, filtering and column resizing. Only the preview data reader
  // is replaced by this read-only snapshot of the same compiled email builders.
  const entryId = resolve('email-library-export.jsx');
  const snapshotId = '\0email-library-snapshot';
  // The SSR reader above starts Vite in development mode; the exported UI needs
  // production JSX to agree with its bundled production React runtime.
  process.env.NODE_ENV = 'production';
  const result = await build({
    cacheDir, base: './', publicDir: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{
      name: 'email-library-export', enforce: 'pre',
      resolveId(source, importer) {
        if (source === entryId) return entryId;
        if (source === '../../utils/mockEmail' && importer === resolve('src/components/docs/EmailTemplatesTable.tsx')) return snapshotId;
      },
      load(id) {
        if (id === snapshotId) return `
          const previews = JSON.parse(document.getElementById('email-previews').textContent);
          export function getMockEmailSamples() { return previews; }
          export function subscribeToMockEmailPreviews() { return () => {}; }
        `;
        if (id !== entryId) return;
        return `
          import React from 'react';
          import { createRoot } from 'react-dom/client';
          import { MemoryRouter } from 'react-router-dom';
          import { CssBaseline, Stack, Typography } from '@mui/material';
          import { ThemeProvider } from '@mui/material/styles';
          import { createAppTheme } from ${JSON.stringify(resolve('src/app/theme.ts'))};
          import { Workspace } from ${JSON.stringify(resolve('src/components/admin/AdminPrimitives.tsx'))};
          import EmailTemplatesTable from ${JSON.stringify(resolve('src/components/docs/EmailTemplatesTable.tsx'))};
          const h = React.createElement;
          const theme = createAppTheme(${JSON.stringify(library.client.theme)});
          createRoot(document.getElementById('root')).render(
            h(ThemeProvider, { theme }, h(CssBaseline), h(MemoryRouter, null,
              h(Workspace, null,
                h(Stack, { component: 'header', spacing: 0.75 },
                  h(Typography, { component: 'h1', variant: 'h5', sx: { fontWeight: 800 } }, 'Emails'),
                  h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Inspect transactional email templates and their contact configuration.')
                ),
                h(EmailTemplatesTable, { siteId: ${JSON.stringify(siteId)} })
              )
            ))
          );
        `;
      },
    }],
    build: { write: false, cssCodeSplit: false, lib: { entry: entryId, name: 'EmailLibrary', formats: ['iife'] } },
  });
  const output = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
  const chunks = output.filter(item => item.type === 'chunk');
  if (chunks.length !== 1) throw new Error('Email export must have one inline bundle');
  const css = output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal Library — Emails</title>
<style>${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><noscript>Enable JavaScript to open the email Library.</noscript>
<script id="email-previews" type="application/json">${JSON.stringify(previews).replaceAll('<', '\\u003c')}</script>
<script>${chunks[0].code.replaceAll('</script', '<\\/script')}</script></body></html>`;
  for (const sample of previews) {
    const preview = new JSDOM(sample.html);
    if (!preview.window.document.body.textContent.trim()) throw new Error('Empty email preview');
    for (const image of preview.window.document.images) if (!image.src.startsWith('data:')) throw new Error(`Non-embedded image: ${image.src}`);
    preview.window.close();
  }
  const destination = resolve('dist/standalone/portal-library-emails.html');
  await mkdir(resolve('dist/standalone'), { recursive: true });
  await writeFile(destination, html);
  console.log(`Exported existing Library UI with ${previews.length} email templates: ${destination} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
} finally {
  await server.close();
  await rm(cacheDir, { recursive: true, force: true });
  dom.window.close();
}
