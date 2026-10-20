import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { buildDocumentSections } from '../components/content/applicationDocumentSections';
import { getActiveClient } from '../config/client/getActiveClient';
import { fieldCatalog } from '../config/fields';

type Line = { text: string; heading?: boolean };
export function applicationPdfLines(values: ApplicationFormValues, paymentOnly = false): Line[] {
  const lines: Line[] = [{ text: getActiveClient().branding.name, heading: true }, { text: paymentOnly ? 'Payment information' : 'Insurance Application Review Copy', heading: true }];
  for (const section of paymentOnly ? [] : buildDocumentSections(values)) {
    lines.push({ text: section.title, heading: true });
    for (const group of section.groups) {
      if (group.title) lines.push({ text: group.title, heading: true });
      for (const entry of group.entries) lines.push({ text: `${entry.label}: ${entry.value}` });
    }
  }
  // Include collected health/billing rows that the existing Review preview omits.
  for (const [key, value] of Object.entries(values)) {
    if (!/^(health-(li|si|di|cir)-|payment-|billing-|bill-|ach-|bank-)/.test(key)) continue;
    if (paymentOnly && key.startsWith('health-')) continue;
    const label = fieldCatalog[key as keyof typeof fieldCatalog]?.label ?? key.replaceAll('-', ' ');
    if (Array.isArray(value)) {
      lines.push({ text: label, heading: true });
      for (const [index, row] of value.entries()) {
        lines.push({ text: `Details ${index + 1}`, heading: true });
        if (row && typeof row === 'object') for (const [name, detail] of Object.entries(row)) lines.push({ text: `${name.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${String(detail)}` });
      }
    } else lines.push({ text: `${label}: ${String(value)}` });
  }
  if (!paymentOnly) lines.push({ text: 'QuickDecision health history: ', heading: true });
  return lines;
}

/** Canvas pages preserve browser fonts/Unicode without another PDF dependency. */
export function createApplicationPdf(values: ApplicationFormValues, paymentOnly = false): Blob {
  const canvas = document.createElement('canvas'); canvas.width = 1190; canvas.height = 1684;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PDF rendering is unavailable in this browser');
  const pages: Uint8Array[] = [];
  let y = 100;
  const begin = () => { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#172554'; y = 100; };
  const finish = () => {
    context.font = '20px Arial'; context.fillStyle = '#475569'; context.fillText(`Application data - Page ${pages.length + 1}`, 80, 1620);
    const binary = atob(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]);
    pages.push(Uint8Array.from(binary, character => character.charCodeAt(0)));
  };
  begin();
  for (const line of applicationPdfLines(values, paymentOnly)) {
    if (line.heading && y > 1440) { finish(); begin(); }
    context.font = line.heading ? 'bold 28px Arial' : '22px Arial';
    const words = line.text.split(/\s+/); let text = '';
    const draw = () => {
      if (y > 1530) { finish(); begin(); context.font = line.heading ? 'bold 28px Arial' : '22px Arial'; }
      context.fillStyle = line.heading ? '#172554' : '#1e293b'; context.fillText(text, 80, y); y += 34; text = '';
    };
    if (line.heading) y += 18;
    for (const word of words) {
      // Character splitting also handles long addresses/identifiers safely.
      for (const character of `${word} `) {
        if (context.measureText(text + character).width > 1030) draw();
        text += character;
      }
    }
    if (text) draw();
    y += 8;
  }
  finish();
  return jpegPagesToPdf(pages, canvas.width, canvas.height);
}

export function jpegPagesToPdf(pages: Uint8Array[], width: number, height: number): Blob {
  const encoder = new TextEncoder(); const chunks: Uint8Array[] = []; const offsets = [0]; let size = 0;
  const append = (value: string | Uint8Array) => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; chunks.push(bytes); size += bytes.length; };
  const object = (id: number, body: string | (() => void)) => { offsets[id] = size; append(`${id} 0 obj\n`); if (typeof body === 'string') append(body); else body(); append('\nendobj\n'); };
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`);
  pages.forEach((page, index) => {
    const id = 3 + index * 3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Image ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`);
    object(id + 1, () => { append(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.length} >>\nstream\n`); append(page); append('\nendstream'); });
    const content = 'q 595 0 0 842 0 0 cm /Image Do Q';
    object(id + 2, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  const xref = size;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const bytes = new Uint8Array(size); let position = 0; for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.length; }
  return new Blob([bytes], { type: 'application/pdf' });
}

export function downloadApplicationPdf(values: ApplicationFormValues, paymentOnly = false) {
  const url = URL.createObjectURL(createApplicationPdf(values, paymentOnly));
  const link = document.createElement('a'); link.href = url; link.download = paymentOnly ? 'payment-information.pdf' : 'application-data.pdf'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
