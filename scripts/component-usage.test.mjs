// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createComponentAnalyzer } from './storybook-component-analysis.mjs';
import { createComponentUsage } from './component-usage.mjs';

const roots = [];
afterEach(() => roots.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));
function fixture() {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-component-usage-')); roots.push(root);
 const files = {
  'src/app/router.tsx': `import One from '../pages/One'; import Two from '../pages/Two'; import Internal from '../pages/Internal'; import AppShell from '../components/layout/AppShell'; const pageComponents = {one: One, two: Two, internal: Internal}; function Route(){return <AppShell/>;}`,
  'src/pages/One.tsx': `import Common from '../components/Common'; import Single from '../components/Single'; import Unused from '../components/Unused'; import {Button} from '@mui/material'; export default function One(){return <><Common/><Single/><Single/><Button>Continue</Button></>;}`,
  'src/pages/Two.tsx': `import Common from '../components/Common'; export default function Two(){return <Common/>;}`,
  'src/pages/Internal.tsx': `import Single from '../components/Single'; export default function Internal(){return <Single/>;}`,
  'src/components/Common.tsx': 'export default function Common(){return <input/>;}',
  'src/components/Single.tsx': 'export default function Single(){return <input/>;}',
  'src/components/Unused.tsx': 'export default function Unused(){return <input/>;}',
  'src/components/Common.stories.tsx': `import Single from './Single'; export const Example = () => <Single/>;`,
  'src/components/Common.test.tsx': `import Single from './Single'; const Example = () => <Single/>;`,
  'src/components/layout/AppShell.tsx': `import Header from './Header'; export default function AppShell(){return <Header/>;}`,
  'src/components/layout/Header.tsx': 'export default function Header(){return <header/>;}',
 };
 for (const [file, source] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, file)), {recursive:true}); fs.writeFileSync(path.join(root, file), source); }
 const analyzer = createComponentAnalyzer(root);
 const pages = ['one', 'two', 'internal'].map(key => ({key,definition:{displayName:key,flow:key==='internal'?'internal':'application'}}));
 return createComponentUsage(analyzer, pages, Object.keys(files).filter(analyzer.uiSource));
}
it('counts distinct production placements and excludes unused imports, tests, stories and internal pages', () => {
 const usage = fixture();
 expect(usage('src/components/Common.tsx').map(use => use.pageKey)).toEqual(['one','two']);
 expect(usage('src/components/Single.tsx')).toHaveLength(1);
 expect(usage('src/components/Unused.tsx')).toEqual([]);
});
it('records shared app chrome in each page context without copying its definition', () => {
 const usage = fixture();
 expect(usage('src/components/layout/Header.tsx').map(use => use.pageKey)).toEqual(['one','two']);
 expect(usage('src/components/layout/Header.tsx').every(use => use.source === 'src/components/layout/AppShell.tsx')).toBe(true);
 expect(usage('src/components/layout/AppShell.tsx').map(use => use.pageKey)).toEqual(['one','two']);
});
it('tracks actual package button renders rather than inventing a portal wrapper', () => {
 const usage = fixture();
 expect(usage('@mui/material/Button', {module:'@mui/material',symbol:'Button'})).toMatchObject([{source:'src/pages/One.tsx',pageKey:'one'}]);
});
