import { isReferenceRateTable, type ReferenceRateTable } from './ratePresentation';
import { mockRequest } from '../mock/client';
/** Parse CSV without treating quotes, formulas or markup as executable content. */
export function csvRows(text: string) {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\t' || c === '\n')) { row.push(cell.trim()); cell = ''; if (c === '\n') { if (row.some(Boolean)) rows.push(row); row = []; } }
    else if (c !== '\r') cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function parseTextRateTable(text: string, extension: string, title: string): ReferenceRateTable {
  if (extension === 'json') { const table = JSON.parse(text); if (!isReferenceRateTable(table)) throw new Error('Invalid reference table JSON'); return table; }
  let rows: string[][];
  if (['csv','tsv'].includes(extension)) rows = csvRows(text);
  else {
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('External XML entities are unsupported');
    const doc = new DOMParser().parseFromString(text, extension === 'html' ? 'text/html' : 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
    const records = [...doc.querySelectorAll('tr, row, record, rate')];
    rows = records.map(record => [...record.children].map(cell => cell.textContent?.trim() ?? ''));
    if (records.length && records[0].tagName.toLowerCase() !== 'tr') rows.unshift([...records[0].children].map(cell => cell.tagName));
  }
  const table = { version: 1 as const, kind: 'html-table' as const, title, columns: rows[0] ?? [], rows: rows.slice(1), notes: ['Imported reference table. Verify columns, units, collection frequency and footnotes against the supplied source.'] };
  if (!isReferenceRateTable(table)) throw new Error('No complete rectangular table found. Supply a tabular CSV/XML/HTML/JSON file or use a reference URL.');
  return table;
}
export async function importRateTable(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Rate upload must be at most 5 MiB');
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  if (['csv','tsv','xml','html','json'].includes(extension)) return { table: parseTextRateTable(await file.text(), extension, file.name), converted: true, warning: 'Verify the imported table before saving.' };
  if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) throw new Error('PDF/image extraction requires the local mock upload service. Use CSV/XML/HTML/JSON or a reference URL here.');
  const bytes = new Uint8Array(await file.arrayBuffer()); let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const result = await mockRequest<{ table: ReferenceRateTable; converted: boolean; warning: string }>('/rates/import', { filename: file.name, title: file.name, base64: btoa(binary) });
  if (!isReferenceRateTable(result.table)) throw new Error('Upload service returned an invalid reference table');
  return result;
}
