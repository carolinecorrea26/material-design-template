import fs from 'node:fs';
import ts from 'typescript';
import { createHash } from 'node:crypto';
const roots=['src/components','src/pages','src/app/sections','src/app/workflows'];
const excluded=/\/(admin|docs|demo|dev)\/|\.(test|stories)\./;
const files=roots.flatMap(root=>fs.readdirSync(root,{recursive:true}).map(file=>`${root}/${file}`).filter(file=>file.endsWith('.tsx')&&!excluded.test(file)&&fs.statSync(file).isFile())).filter(file=>!/^src\/pages\/(Cms|DesignSystem|MockEmailPreview|PortalAdmin|PortalRequirementsProject|PortalTemplateProject|SiteDetails|SiteFeatures)\.tsx$/.test(file));
files.push('src/app/RoutePage.tsx');
files.sort();
const groups=new Map();const inventory=[];
function signature(node){let tokens=[];function visit(n){let value=String(n.kind);if(ts.isIdentifier(n)){const p=n.parent;value=(ts.isJsxOpeningElement(p)||ts.isJsxClosingElement(p)||ts.isJsxSelfClosingElement(p)||ts.isJsxAttribute(p)||ts.isPropertyAssignment(p)&&p.name===n||ts.isPropertyAccessExpression(p)&&p.name===n)?`I:${n.text}`:'I';}else if(ts.isStringLiteralLike(n)||ts.isNumericLiteral(n)||ts.isJsxText(n))value='L';tokens.push(value);ts.forEachChild(n,visit);}visit(node);return tokens;}
for(const file of files){const code=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let calls=[];function visit(n){if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n)){const tokens=signature(n);if(tokens.length>=45){const key=tokens.join('|'),row={file,line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1,size:tokens.length,tag:ts.isJsxElement(n)?n.openingElement.tagName.getText(ast):ts.isJsxSelfClosingElement(n)?n.tagName.getText(ast):'Fragment'};groups.set(key,[...(groups.get(key)||[]),row]);}}if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))calls.push(n.tagName.getText(ast));ts.forEachChild(n,visit);}visit(ast);inventory.push({file,sha256:createHash('sha256').update(code).digest('hex'),lines:code.split('\n').length,jsx:[...new Set(calls)]});}
let duplicates=[...groups.values()].filter(rows=>rows.length>1).sort((a,b)=>b[0].size-a[0].size);const picked=[];const covered=new Map();for(const group of duplicates){const identity=[...new Set(group.map(r=>r.file))].sort().join('|');const limit = new Set(group.map(row => row.file)).size === 1 ? 3 : 1; if((covered.get(identity) ?? 0)>=limit)continue; covered.set(identity,(covered.get(identity) ?? 0)+1);picked.push(group);}
const catalogBytes = fs.readFileSync('public/catalog/portal.json');
const catalog = JSON.parse(catalogBytes).data;
const sources = new Set(inventory.map(row => row.file));
const components = catalog.components.map(({key,definition}) => ({ key, name: definition.name, role: definition.role, source: definition.source, placements: definition.usages?.length ?? 0, directConsumerFiles: [...new Set((definition.usages ?? []).map(row => row.source))].sort() }));
const uncovered = components.filter(row => !row.source.startsWith('@mui/') && !sources.has(row.source));
if (uncovered.length) throw new Error(`Canonical sources missing from scan: ${uncovered.map(row => row.name).join(', ')}`);
const declarations = Object.values(JSON.parse(fs.readFileSync('requirements/global/components.json','utf8'))).flat().filter(row => row?.name);
const catalogNames = new Set(components.map(row => row.name));
const report = {
  reviewedAt: '2026-11-13',
  scope: 'Global template and ASCE; applicant pages, chrome, shared pieces and binding adapters. Other real-Site rollouts, Admin/reference/demo UI and dependency internals are excluded.',
  method: 'Source inventory, JSX shape comparison and manual review recorded in component-reuse-audit.md. Shapes ignore literal values and most local variable names; candidates do not prove interchangeable behavior. Placements include conditional source branches, not mounted instances.',
  applicationSourceChanged: true,
  completedFindings: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
  pendingFindings: [],
  catalogSha256: createHash('sha256').update(catalogBytes).digest('hex'),
  pageIds: catalog.pages.filter(row => row.definition.flow !== 'internal').map(row => row.key).sort(),
  summary: { pages: catalog.pages.filter(row => row.definition.flow !== 'internal').length, canonicalComponents: components.length, localUiModules: inventory.length, multiplePlacementRecords: components.filter(row => row.placements >= 2).length, multipleDirectConsumerFiles: components.filter(row => row.directConsumerFiles.length >= 2).length, uncoveredCanonicalSources: uncovered.length },
  declarationsWithoutCanonicalRecords: declarations.filter(row => !catalogNames.has(row.name)).map(row => row.name),
  components, modules: inventory, structuralCandidates: picked,
};
const output = JSON.stringify(report,null,2)+'\n';
const destination = 'docs/project-review/component-reuse-evidence.json';
if (process.argv.includes('--check')) { if (fs.readFileSync(destination,'utf8') !== output) throw new Error('Stale component reuse evidence'); }
else fs.writeFileSync(destination,output);
console.log(JSON.stringify(report.summary));
