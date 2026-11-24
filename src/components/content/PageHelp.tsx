import { useState } from 'react';
import PageHelpChips, { type PageHelpItem } from './PageHelpChips';
import PageHelpDrawer from './PageHelpDrawer';

/** Reusable page-help interaction. Topics, wording and content are explicit inputs. */
export default function PageHelp({ items }: { items: PageHelpItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = items.find(item => item.id === activeId) ?? null;
  if (!items.length) return null;
  return <>
    <PageHelpChips items={items} onSelect={setActiveId} />
    <PageHelpDrawer item={activeItem} onClose={() => setActiveId(null)} />
  </>;
}
