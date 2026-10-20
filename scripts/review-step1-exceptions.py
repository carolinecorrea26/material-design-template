import json, hashlib, collections, argparse
from pathlib import Path
parser=argparse.ArgumentParser(description='Capture Step 1 ownership and MCR exception evidence without changing runtime data.')
parser.add_argument('database', type=Path, help='Reviewed database.json from reviewedExport.test.ts')
parser.add_argument('--output', type=Path, default=Path('docs/project-review/step1-exception-evidence.json'))
args=parser.parse_args()
source=Path('src/migration/sources/mcr.json'); seed=args.database
m=json.loads(source.read_text()); d=json.loads(seed.read_text()); active=['abe','ama','asce','avma','csea','nso','isitrust','waepa','waepa-gi']; aset=set(active)
refs={
 'Associations':['A7','B7','C7','D7','E7','A8','B8','C8','D8','E8','A15','B15','D15','A16','B16','D16','A60','B60','D60','E60','D61','A346','B346','D346','E346','A347','B347','D347','E347','A352','B352','D352','A356','B356','D356','E356','A387','B387','D387','E387','F387'],
 'Main':['A39','D118','E118','G118','H118','I118','J118','L118','O118','AR118','D119','E119','G119','R118','R119','D197','E197','R283','R284','R285','R286','R379','R380','H379','H380'],
 'New UX Multi-page Requirements':['A32','AA32','A43','AA43','AX43','BA43','BB43','BC43','V31','AA31','V51','AA51','V15','AA15'],
 'New UX Single-Page Requirements':['A27','M27','N27','A17','H17']}
evidence=[c for c in m['cells'] if c['cell'] in refs.get(c['sheet'],[])]
assert len(evidence)==sum(map(len,refs.values())), 'missing source reference'
items=[]
for table in ['configurationValues','contentValues','brandingProfiles','supportProfiles','sitePolicies','siteFieldConfigurations','sitePages','ruleAssignments']:
 for x in d[table]:
  scope=x.get('scope','site'); client=x.get('clientKey'); site=x.get('siteKey')
  if scope!='global' and client not in aset and site not in aset: continue
  key=x.get('configurationKey',x.get('contentKey',x.get('key',x['id'])))
  target=site or client
  if x['id'].startswith('mcr.'):
   owner='source-evidence'; destination='sourceRequirements / referenced source-only catalog'; reason='Archived MCR content is not an adopted global template value.'
  elif table=='configurationValues' and key=='tpaIntegration.prototypeRecords':
   owner='mock-service'; destination='mock integration fixtures'; reason='Simulated lookup results are service state, not published Site policy.'
  elif table=='configurationValues' and key=='licenseInfo':
   owner='TPA-program'; destination='organizationProfiles administration contact for Association, referenced by Site'; reason='Administrator licensing belongs to the administrator/program context, not the generic applicant template.'
  elif table=='supportProfiles':
   owner='TPA-program'; destination='organizationProfiles program contacts plus Association support reference and purpose-specific Site contact'; reason='Preserve administrator and program identity; do not flatten program-specific phone/address into one TPA-wide value.'
  elif table=='brandingProfiles':
   owner='mixed-Association-and-Site' if scope!='site' else 'Site'; destination='Association name/acronym/logo/alt; Site logo override/icon selection'; reason='Shared identity is inherited; Site artwork selection is an explicit override.'
  elif scope=='global':
   owner='global'; destination=table; reason='Reusable template definition/default; explicit scoped applicability and overrides remain separate.'
  else:
   owner='Site'; destination=table; reason='Experience, portfolio, rule applicability, field placement or content override belongs to the configured Site; legacy client scope does not prove shared Association meaning.'
  items.append({'table':table,'id':x['id'],'key':key,'storedScope':scope,'clientKey':client,'siteKey':site,'intendedOwner':owner,'intendedTarget':target,'destination':destination,'reason':reason,'reviewState':'ownership-classification-only-not-policy-approval','sourceReference':x.get('sourceReference')})
portfolios=[]
for s in d['sites']:
 if s['key'] not in aset:continue
 p=[x['productKey'] for x in d['siteProducts'] if x['siteId']==s['id'] and x['enabled']]
 c=[x['coverageKey'] for x in d['siteCoverages'] if x['siteId']==s['id'] and x['enabled']]
 v=next((x['value'] for x in d['configurationValues'] if x['configurationKey']=='coverages.enabled' and x['clientKey']==s['clientId']),None)
 portfolios.append({'siteKey':s['key'],'siteProducts':p,'siteCoverages':c,'legacyClientEnabled':v,'legacyClientEnabledStatus':'retired-or-absent' if v is None else 'retained','productsOnly':sorted(set(p)-set(c)),'coveragesOnly':sorted(set(c)-set(p))})
isi=[]
for x in d['configurationValues']:
 if x['configurationKey'].startswith('isitrust.') and x['configurationKey'].endswith('.journey-policy'):
  isi.append({'configurationKey':x['configurationKey'],'associationChoices':x['value']['associationChoices']})
report={'date':'2026-10-19','scope':active,'boundary':'Fresh detached reviewed export; no connected database inspection or policy/runtime mutation. Owner assignments are review classifications, not business approval.', 'sourceFiles':{'mcr':{'path':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'workbookSha256':m['sha256']},'database':{'path':str(seed),'sha256':hashlib.sha256(seed.read_bytes()).hexdigest(),'matchesCheckedInMockExport':seed.read_bytes()==Path('migration-artifacts/mock/database.json').read_bytes()}},'sourceCells':evidence,'portfolios':portfolios,'isiJourneyAssociationChoices':isi,'ownerCounts':dict(collections.Counter(x['intendedOwner'] for x in items)),'ownershipItems':items,'existingProvisionalRecords': [{'key':x['key'],'predicate':x['predicate'],'subjectKey':x['subjectKey'],'sourceReference':x.get('sourceReference'),'revisit':x['value'].get('revisit')} for x in d['semanticRequirements'] if x['domain']=='provisional-source-decision' and x['subjectKey'] in aset]}
report['implementedOwnershipContinuations']=[{'key':row['key'],'predicate':row['predicate'],'subjectTable':row['subjectTable'],'subjectKey':row['subjectKey'],'value':row['value']} for row in d['semanticRequirements'] if row['domain']=='information-ownership' and row['predicate'] in ['shared-field-required','site-product-availability','stored-site-structure']]
report['settledOwnershipSubjects']=['Fields: global definitions and intentional scoped properties/placements','Riders: accepted identities, relationships, amounts and scoped differences; existing provisional/source-only dispositions retained']
report['remainingBusinessReview']=['Executable policy/condition duplication beyond routing versus descriptive rule text','Page/flow exceptions beyond stored participation, routing and template mode','Global/Association/Site settings, content and branding copies beyond stored structure']
p=args.output;p.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'report':str(p),'sourceCells':len(evidence),'ownershipItems':len(items),'ownerCounts':report['ownerCounts'],'enabledBusinessPairs':sum(len(x['siteProducts']) for x in portfolios),'isiPolicies':len(isi),'provisionalRecords':len(report['existingProvisionalRecords'])},indent=2))
