import SinglePageSections from "../components/layout/SinglePageSections";
import { applicationPageComponents } from './pageComponents';
import type { PageId } from "../types";

export default function SinglePageApplication({ initialPageId }: { initialPageId?: PageId }) {
  return <SinglePageSections initialPageId={initialPageId} renderPage={pageId => {
    const Component = applicationPageComponents[pageId];
    return Component ? <Component key={pageId} /> : null;
  }} />;
}
