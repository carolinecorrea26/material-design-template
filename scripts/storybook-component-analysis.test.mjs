// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createComponentAnalyzer, storyForComponent } from './storybook-component-analysis.mjs';

const roots = [];
afterEach(() => roots.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));
function analyze(story, directory = 'src/components') {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storybook-source-audit-')); roots.push(root);
 fs.mkdirSync(path.join(root, directory), { recursive: true });
 fs.writeFileSync(path.join(root, directory, 'Real.tsx'), 'export default function Real() { return <input />; }');
 fs.writeFileSync(path.join(root, directory, 'Other.tsx'), 'export default function Other() { return <button />; }');
 fs.writeFileSync(path.join(root, directory, 'Real.stories.tsx'), story);
 return createComponentAnalyzer(root).stories(`${directory}/Real.stories.tsx`);
}
it.each(['src/components/docs', 'src/docs/foundations', 'src/docs/guidelines'].flatMap(directory => ['{}', '{ render: () => <Real /> }'].map(story => [directory, story])))('recognizes documentation source rendering without adding it to applicant inventory: %s %s', (directory, story) => {
 const [row] = analyze(`import Real from './Real'; export default {title:'Foundations/Real',component:Real}; export const Default = ${story};`, directory);
 expect(row.components).toEqual([{ source:`${directory}/Real.tsx`, symbol:'default', binding:'Real' }]);
 expect(createComponentAnalyzer().uiSource(`${directory}/Real.tsx`)).toBe(false);
});
it('does not credit documentation meta when explicit rendering uses copied markup', () => {
 const [row] = analyze(`import Real from './Real'; export default {title:'Foundations/Real',component:Real}; export const Fake = {render: () => <div><input /></div>};`, 'src/components/docs');
 expect(row.components).toEqual([]);
});
it('does not count a declared meta component when the render replaces it with copied markup', () => {
 const [row] = analyze(`import Real from './Real'; export default {title:'Forms/Real',component:Real}; export const Fake = {render: () => <div><input /></div>};`);
 expect(row.components).toEqual([]);
});
it('follows an aliased real import through a local interactive harness', () => {
 const [row] = analyze(`import ActualInput from './Real'; export default {title:'Forms/Real'}; function Harness(){ return <ActualInput />; } export const Interactive = {render: () => <Harness />};`);
 expect(row.components).toEqual([{ source:'src/components/Real.tsx', symbol:'default', binding:'ActualInput' }]);
});
it('recognizes CSF default rendering for an args-only story', () => {
 const [row] = analyze(`import Real from './Real'; const meta={title:'Forms/Real',component:Real}; export default meta; export const Default = {args: {disabled:true}};`);
 expect(row.renderKind).toBe('CSF default component renderer');
 expect(row.components[0].source).toBe('src/components/Real.tsx');
});
it('rejects nonexistent exports rather than treating any existing file as a real component', () => {
 const [row] = analyze(`import { Invented } from './Real'; export default {title:'Forms/Real'}; export const Fake = () => <Invented />;`);
 expect(row.components).toEqual([]); expect(row.unresolved).toContain('Invented: src/components/Real.tsx does not export Invented');
});
it('does not count a type-only import as runtime UI', () => {
 const [row] = analyze(`import type Real from './Real'; export default {title:'Forms/Real'}; export const Fake = () => <Real />;`);
 expect(row.components).toEqual([]); expect(row.unresolved).toContain('Real: no source binding');
});
it('links each component to its actual story, not the first export in a combined story module', () => {
 const rows = analyze(`import Real from './Real'; import Other from './Other'; export default {title:'Forms/Real'}; export const First = () => <Real />; export const Second = () => <Other />;`);
 expect(storyForComponent(rows,'src/components/Other.tsx').id).toBe('forms-real--second');
});

it.each([true, false])('follows an imported fixture without counting copied fixture markup as a production component: real=%s', real => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storybook-fixture-audit-')); roots.push(root);
 fs.mkdirSync(path.join(root, 'src/components'), { recursive: true });
 fs.mkdirSync(path.join(root, '.storybook'), { recursive: true });
 fs.writeFileSync(path.join(root, 'src/components/Real.tsx'), 'export default function Real() { return <input />; }');
 fs.writeFileSync(path.join(root, '.storybook/Fixture.tsx'), real ? "import Real from '../src/components/Real'; export default function Fixture(){return <Real />;}" : 'export default function Fixture(){return <div><input /></div>;}');
 fs.writeFileSync(path.join(root, 'src/components/Real.stories.tsx'), "import Fixture from '../../.storybook/Fixture'; export default {title:'Forms/Example'}; export const Default={render:()=> <Fixture />};");
 const [story] = createComponentAnalyzer(root).stories('src/components/Real.stories.tsx');
 expect(story.components.map(component => component.source)).toEqual(real ? ['src/components/Real.tsx'] : []);
});
