import { build } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

const publicRoot = resolve('public');
const mimeTypes = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const assets = new Map();
async function embedAsset(url) {
  if (assets.has(url)) return assets.get(url);
  if (!url.startsWith('/') || url.startsWith('//') || !mimeTypes[extname(url)]) return url;
  const path = resolve(publicRoot, '.' + url);
  if (!path.startsWith(publicRoot + sep) || !existsSync(path)) return url;
  const result = `data:${mimeTypes[extname(url)]};base64,${(await readFile(path)).toString('base64')}`;
  assets.set(url, result);
  return result;
}
async function embedCatalog(value) {
  if (typeof value === 'string') return embedAsset(value);
  if (Array.isArray(value)) return Promise.all(value.map(embedCatalog));
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await embedCatalog(item)])));
  return value;
}

// Use the ordinary application and its validated public catalog, without mock APIs.
const result = await build({
  base: './',
  publicDir: false,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.VITE_STANDALONE_HTML': 'true', 'import.meta.env.VITE_MOCK_PLATFORM_ENABLED': 'false' },
  build: { write: false, cssCodeSplit: false, lib: { entry: resolve('src/main.tsx'), name: 'AdminCenter', formats: ['iife'] } },
});
const output = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
const chunks = output.filter(item => item.type === 'chunk');
if (chunks.length !== 1) throw new Error('Standalone build must contain exactly one JavaScript bundle.');
let code = chunks[0].code;
// Public image paths also occur in component code and in the embedded catalog.
const literals = [...new Set(code.match(/"\/[^"\n]+\.(?:svg|png|jpe?g|gif|webp|ico|woff2?|pdf)"/g) ?? [])];
for (const literal of literals) code = code.replaceAll(literal, JSON.stringify(await embedAsset(JSON.parse(literal))));
let css = output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n');
for (const match of [...css.matchAll(/url\(["']?(\/[^)'"\s]+)["']?\)/g)]) css = css.replaceAll(match[0], `url("${await embedAsset(match[1])}")`);
const catalog = await embedCatalog(JSON.parse(await readFile(resolve('public/catalog/portal.json'), 'utf8')));
const logo = await embedAsset('/favicon.svg');
const boot = `
if (!location.hash || location.hash === '#') location.replace(location.href.split('#')[0] + '#/admin-center');
// Ordinary anchors within the prototype must keep pointing into this same file.
function localLinks(root) {
  for (const link of root.querySelectorAll('a[href^="/"]')) {
    const href = link.getAttribute('href');
    if (!href.startsWith('//')) link.setAttribute('href', location.href.split('#')[0] + '#' + href);
  }
  for (const link of root.querySelectorAll('a[href^="#"]')) {
    const href = link.getAttribute('href');
    if (!href.startsWith('#/')) link.setAttribute('href', location.href.split('#')[0] + '#' + location.hash.slice(1).split('#')[0] + href);
  }
}
new MutationObserver(() => localLinks(document)).observe(document.getElementById('root'), {childList: true, subtree: true, attributes: true, attributeFilter: ['href']});
`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin Center — Local Prototype</title><link rel="icon" href="${logo}"><style>${css.replaceAll('</style', '<\\/style')}</style></head>
<body><noscript>Enable JavaScript to open Admin Center.</noscript><div id="root"></div>
<script id="standalone-catalog" type="application/json">${JSON.stringify(catalog).replaceAll('<', '\\u003c')}</script>
<script>${boot}${code.replaceAll('</script', '<\\/script')}</script></body></html>`;
await mkdir(resolve('dist/standalone'), { recursive: true });
const destination = resolve('dist/standalone/admin-center.html');
await writeFile(destination, html);
console.log(`Standalone Admin Center: ${destination} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
