import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { libraryColumns, libraryTableNames } from './libraryColumns';
import { withLibraryMetadata } from './LibraryTableMetadata';
import { libraryDisplayId } from '../../domain/provenance';
import CoverageRelations from '../../pages/admin/library/CoverageRelations';
import { coverages } from '../../config/coverages';
import { riderEntityKey } from "../../domain/riderIdentity";
import { createMigrationDatabase } from "../../migration/fixtures";

const db = createMigrationDatabase();

describe('shared Portal Library metadata and relations', () => {
  it('adds stable numeric IDs and Provided by to every common table without duplicate columns', () => {
    for (const table of Object.values(libraryTableNames)) {
      const columns = libraryColumns<{ key: string }>(table, [], r => r.key);
      expect(columns.map(c => c.label)).toEqual(['ID #']);
      expect(columns[0].value({ key: 'sample' })).toBe(String(libraryDisplayId(table, 'sample')));
      expect(libraryColumns(table, columns, r => r.key)).toHaveLength(1);
    }
  });
  it('places IDs last and hides path and migration ownership', () => {
    const columns = libraryColumns<{ key: string }>('pages', [
      { id: 'displayId', label: 'ID', value: () => '123' },
      { id: 'name', label: 'Page', value: r => r.key },
      { id: 'path', label: 'Path', value: () => '/' },
      { id: 'providedBy', label: 'Provided by', value: () => 'Dev/QA' },
    ], r => r.key);
    expect(columns.map(c => c.id)).toEqual(['name', 'displayId']);
  });
  it('adapts keyed legacy entity rows with the same namespace identity', () => {
    const html = renderToStaticMarkup(<>{withLibraryMetadata(<Table><TableHead><TableRow><TableCell>Name</TableCell></TableRow></TableHead><TableBody><TableRow key="example"><TableCell>Example</TableCell></TableRow></TableBody></Table>, 'products')}</>);
    expect(html).toContain('ID #'); expect(html).not.toContain('Provided by');
    expect(html).toContain(String(libraryDisplayId('products', 'example')));
  });
  it('replaces legacy ID columns with one shared ID at the end', () => {
    const html = renderToStaticMarkup(<>{withLibraryMetadata(<Table><TableHead><TableRow><TableCell>Configuration ID</TableCell><TableCell>Setting</TableCell></TableRow></TableHead><TableBody><TableRow key="config-example"><TableCell>config-example</TableCell><TableCell>Example</TableCell></TableRow></TableBody></Table>, 'configurationDefinitions')}</>);
    expect(html).not.toContain('Configuration ID');
    expect(html.match(/ID #/g)).toHaveLength(1);
    expect(html).toContain(String(libraryDisplayId('configurationDefinitions', 'config-example')));
    expect(libraryColumns<{ key: string }>('rules', [{ id: 'id', label: 'Rule ID', value: row => row.key }, { id: 'name', label: 'Rule', value: row => row.key }], row => row.key).map(column => column.label)).toEqual(['Rule', 'ID #']);
  });
  it('targets rider definitions rather than product-rider junctions', () => {
    const html = renderToStaticMarkup(<CoverageRelations products={coverages} siteKey={null} />);
    expect(html).toContain('Product riders');
    for (const product of coverages) for (const rider of product.riders ?? []) {
      const key = riderEntityKey(product.id, rider);
      expect(db.riders.some(r => r.key === key)).toBe(true);
      expect(db.productRiders.find(r => r.productKey === product.id && r.scope === 'global' && r.riderKey === key)?.key).not.toBe(key);
      expect(html).toContain(`href="#${key}"`);
      expect(html).toContain(`id="${key}"`);
    }
  });
});
