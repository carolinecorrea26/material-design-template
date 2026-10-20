"""Read-only workbook extraction. Run with bundled Python and the handoff directory.

Preserves cells, formulas, comments, hyperlinks, merges and checklist discrepancies.
No inference of merged/blank product ownership is performed here.
"""
import hashlib
import json
import pathlib
import sys
import zipfile
import posixpath
import xml.etree.ElementTree as ET
import openpyxl

source = pathlib.Path(sys.argv[1])
destination = pathlib.Path('src/migration/sources')
destination.mkdir(parents=True, exist_ok=True)
reference = json.loads((source / '03-portal-library-canonical-reference.json').read_text())
(destination / 'canonical.json').write_text(json.dumps(reference, indent=2) + '\n')
filename = '04-MCR-new-version-full.xlsx'
workbook = openpyxl.load_workbook(source / filename, data_only=False)
cached = openpyxl.load_workbook(source / filename, data_only=True)
archive = zipfile.ZipFile(source / filename)
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
relationships = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
sheet_paths = {}
for node in ET.fromstring(archive.read('xl/workbook.xml')).findall('s:sheets/s:sheet', ns):
    target = relationships[node.attrib['{'+ns['r']+'}id']]
    sheet_paths[node.attrib['name']] = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
def image_count(sheet_name):
    path = sheet_paths[sheet_name]
    relpath = posixpath.dirname(path)+'/_rels/'+posixpath.basename(path)+'.rels'
    if relpath not in archive.namelist(): return 0
    count = 0
    for relation in ET.fromstring(archive.read(relpath)):
        if relation.attrib.get('Type','').endswith('/drawing'):
            target = relation.attrib['Target']
            drawing = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.dirname(path)+'/'+target)
            count += len(ET.fromstring(archive.read(drawing)).findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip'))
    return count
cells = []
sheets = []
for sheet in workbook:
    count = 0
    for row in sheet:
        for cell in row:
            if cell.value is None and cell.comment is None and cell.hyperlink is None:
                continue
            value = cell.value
            if value is not None and not isinstance(value, (str, int, float, bool)):
                value = str(value)
            cells.append(dict(sheet=sheet.title, cell=cell.coordinate, value=value,
                              formula=value if cell.data_type == 'f' else None,
                              cachedValue=cached[sheet.title][cell.coordinate].value if cell.data_type == 'f' else None,
                              comment=cell.comment.text if cell.comment else None,
                              hyperlink=cell.hyperlink.target if cell.hyperlink else None))
            count += 1
    sheets.append(dict(name=sheet.title, cells=count, mergedRanges=[str(r) for r in sheet.merged_cells.ranges],
                       images=image_count(sheet.title)))
checkfile = '05-requirements-to-fill-out-checklist.xlsx'
checklist = openpyxl.load_workbook(source / checkfile, data_only=False).active
checks = [dict(zip(['sheet', 'cell', 'contentType', 'displayedContent', 'formula', 'notes'], row))
          for row in checklist.iter_rows(min_row=5, max_col=6, values_only=True) if row[0] and row[1]]
result = dict(workbook=filename, sha256=hashlib.sha256((source / filename).read_bytes()).hexdigest(),
              checklistSha256=hashlib.sha256((source / checkfile).read_bytes()).hexdigest(),
              sheets=sheets, cells=cells, checklist=checks,
              assets=[dict(path=name, sha256=hashlib.sha256(archive.read(name)).hexdigest()) for name in archive.namelist() if name.startswith('xl/media/')])
(destination / 'mcr.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'), default=str) + '\n')
print(json.dumps(dict(sheets=len(sheets), cells=len(cells), checklist=len(checks))))
