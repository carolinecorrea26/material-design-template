import AppDrawer from '../layout/AppDrawer';
import type { PageHelpItem } from './PageHelpChips';

/** Standard page-help drawer; the caller supplies the selected topic and content. */
export default function PageHelpDrawer({ item, onClose }: { item: PageHelpItem | null; onClose: () => void }) {
  return <AppDrawer open={item !== null} title={item?.title ?? ''} onClose={onClose}>{item?.content}</AppDrawer>;
}
