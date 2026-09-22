/**
 * Scrolls to a page's row in the Pages table, expanding the containing
 * SectionAccordion first if it's currently collapsed. SectionAccordion keeps
 * its children mounted (MUI Collapse, not unmountOnExit) even when collapsed,
 * so the anchor always resolves — but a collapsed section renders at zero
 * height, so scrollIntoView alone would land on an invisible target.
 */
export function navigateToPageAnchor(pageId: string) {
  const target = document.getElementById(`page-${pageId}`);
  if (!target) return;

  const accordion = target.closest(".MuiAccordion-root");
  const collapsedSummary = accordion?.querySelector<HTMLElement>(
    '.MuiAccordionSummary-root[aria-expanded="false"]',
  );

  if (!collapsedSummary) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const collapse = accordion?.querySelector(".MuiCollapse-root");
  let scrolled = false;
  const scrollOnce = () => {
    if (scrolled) return;
    scrolled = true;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  collapse?.addEventListener("transitionend", scrollOnce, { once: true });
  // Fallback in case the transition doesn't fire (e.g. reduced-motion settings).
  setTimeout(scrollOnce, 350);

  collapsedSummary.click();
}
