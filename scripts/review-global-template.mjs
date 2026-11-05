import fs from 'node:fs';
import { readStoryInventory } from './storybook-inventory.mjs';
const inventory = readStoryInventory().filter(story => !/\/(admin|docs)\//.test(story.file));
const ids = new Set(inventory.flatMap(story => story.storyIds));
const register = JSON.parse(fs.readFileSync('docs/project-review/global-template-capabilities.json','utf8'));
const missing = register.rows.flatMap(row => row.examples.filter(id => !ids.has(id)).map(storyId => ({ capability: row.capability, storyId })));
const scoped = inventory.filter(story => /\bsiteKey\s*:|\bsiteId\s*=|buildContentForClientAlias\s*\(/.test(fs.readFileSync(story.file,'utf8'))).map(story=>story.file);
if (missing.length || scoped.length) throw new Error(JSON.stringify({ missingCapabilityExamples: missing, siteScopedStories: scoped },null,2));
console.log(`Global template: ${register.sourceCount} source configurations accounted for across ${register.scope.length} reviewed pages; ${register.rows.length} capability groups; ${new Set(register.rows.flatMap(row=>row.examples)).size} linked examples; no site selectors in applicant stories.`);
