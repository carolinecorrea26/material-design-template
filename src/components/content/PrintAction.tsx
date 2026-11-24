import { Button } from '@mui/material';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import { requirementText } from '../../domain/requirementContent';

/** Print only the requested disclosure, without surrounding controls or page chrome. */
export function printContent(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const frame = document.createElement('iframe');
  frame.title = requirementText('document.print');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) { frame.remove(); return; }
  doc.title = target.getAttribute('aria-label') ?? document.title;
  for (const style of document.querySelectorAll('style, link[rel="stylesheet"]')) doc.head.append(style.cloneNode(true));
  doc.body.append(target.cloneNode(true));
  const cleanup = () => frame.remove();
  frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  void (doc.fonts?.ready ?? Promise.resolve()).then(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  });
  window.setTimeout(cleanup, 60000);
}

export default function PrintAction({ targetId, onPrint }: { targetId: string; onPrint?: () => void }) {
  return <Button type="button" startIcon={<PrintRoundedIcon />} onClick={onPrint ?? (() => printContent(targetId))}>{requirementText('document.print')}</Button>;
}
