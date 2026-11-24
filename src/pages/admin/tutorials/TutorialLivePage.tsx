import SitePreview from '../../../components/docs/SitePreview';
import type { TutorialPreview } from '../../../domain/tutorials';
export function tutorialPreviewUrl(siteId: string, preview: TutorialPreview, actor: string, step?: string, record?: string) {
  const url = new URL(`${import.meta.env.BASE_URL}admin-center/tutorial-preview/page`, window.location.origin);
  url.searchParams.set('site', siteId); url.searchParams.set('page', preview.pageId); url.searchParams.set('mode', preview.mode); url.searchParams.set('actor', actor);
  if (step) url.searchParams.set('step', step);
  if (record) url.searchParams.set('record', record);
  return url.toString();
}
export default function TutorialLivePage({ siteId, preview, actor, step }: { siteId: string; preview: TutorialPreview; actor: string; step?: string }) {
  const url = tutorialPreviewUrl(siteId, preview, actor, step);
  return <SitePreview key={url} siteId={siteId} clientName={siteId} homePath={url} />;
}
