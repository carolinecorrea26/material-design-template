import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const run = promisify(execFile);
/** Conservative numeric-table extraction. Ambiguous layouts retain the original asset. */
export function numericReferenceTable(text, title) {
  const money = /\$\s*\d[\d,]*(?:\.\d{2})?/g;
  const lines = text.split('\n').map(line => ({ line, cells: [...line.matchAll(money)].map(m => m[0].replace(/\s/g, '')) }));
  const salaryLayout = /Annual[\s\S]*Monthly/.test(text);
  let rows;
  if (salaryLayout) {
    rows = lines.filter(r => /\$[\d,]+\s+(?:to|–|-)\s*\$[\d,]+/.test(r.line));
    // PDF text may place two middle columns immediately above their salary row.
    for (const row of rows) {
      const preceding = lines[lines.indexOf(row) - 1];
      if (row.cells.length === 6 && preceding?.cells.length === 2 && preceding.cells.every(c => /\.\d{2}$/.test(c))) row.cells.splice(4, 0, ...preceding.cells);
    }
    if (!rows.length || rows.some(r => r.cells.length !== 8 || r.cells.slice(3).some(c => !/\.\d{2}$/.test(c)))) return null;
  } else rows = lines.filter(r => r.cells.length >= 3 && /\d+\.\d{2}/.test(r.line));
  if (!rows.length) return null;
  const widths = [...new Set(rows.map(r => r.cells.length))];
  const width = widths.find(w => rows.filter(r => r.cells.length === w).length >= 2);
  if (!width) return null;
  const retained = rows.filter(r => r.cells.length === width);
  // Salary endpoints + monthly benefit + age columns, as in the supplied DI layout.
  const salary = retained.every(r => /\$[\d,]+\s+(?:to|–|-)\s*\$[\d,]+/.test(r.line));
  const columns = salary && width === 8 ? ['Annual salary', 'Monthly benefit', 'Age <30', 'Age 30–39', 'Age 40–49', 'Age 50–59', 'Age 60–64**'] : Array.from({ length: width }, (_, i) => `Source column ${i + 1}`);
  return { version: 1, kind: 'html-table', title, columns, rows: retained.map(r => salary && width === 8 ? [`${r.cells[0]}–${r.cells[1]}`, ...r.cells.slice(2)] : r.cells), notes: ['Automatically extracted reference table. Verify every column, amount, unit, frequency and footnote against the original before saving.'] };
}
export async function extractRateUpload(bytes, extension, title) {
  const directory = await mkdtemp(join(tmpdir(), 'portal-rate-import-'));
  const input = join(directory, `upload.${extension}`);
  const options = { timeout: 30000, maxBuffer: 5 * 1024 * 1024 };
  try {
    await writeFile(input, bytes);
    let text = '';
    if (extension === 'pdf') {
      try { text = (await run(process.env.PORTAL_PDFTOTEXT || 'pdftotext', ['-layout', input, '-'], options)).stdout; } catch { /* image PDF fallback below */ }
      const table = numericReferenceTable(text, title);
      if (table) return table;
      await run(process.env.PORTAL_PDFTOPPM || 'pdftoppm', ['-f','1','-l','1','-scale-to','2400','-png','-singlefile',input,join(directory,'page')], options);
      text = (await run(process.env.PORTAL_TESSERACT || 'tesseract', [join(directory,'page.png'), 'stdout', '--psm','6'], options)).stdout;
    } else text = (await run(process.env.PORTAL_TESSERACT || 'tesseract', [input, 'stdout', '--psm','6'], options)).stdout;
    // Two-row amount/rate image (e.g. AD&D) becomes a vertical HTML table.
    const lines = text.split('\n');
    const principal = lines.find(l => /Principal\s*Sum/i.test(l));
    const rates = lines.find(l => /\$\s*0\.27/.test(l));
    if (principal && rates) {
      const amounts = principal.match(/[S$]\s*[\d,]+/g), prices = rates.match(/\$\s*\d+\.\d{2}/g);
      if (amounts?.length === prices?.length && amounts.length > 1) return { version: 1, kind: 'html-table', title, columns: ['Principal sum','Source rate'], rows: amounts.map((amount,i) => [amount.replace(/^S/, '$').replace(/\s/g,''), prices[i].replace(/\s/g,'')]), notes: ['Automatically extracted. Verify the source collection frequency and all values before saving.'] };
    }
    return numericReferenceTable(text, title);
  } catch { return null; } finally { await rm(directory, { recursive: true, force: true }); }
}
