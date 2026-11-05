import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import HowApplyingWorksPanel from "./HowApplyingWorksPanel";
import withHomeStoryFrame from "../../../.storybook/homeSectionDecorator";
import AppDrawer from "../layout/AppDrawer";
import QuickDecisionDrawerContent from "../content/QuickDecisionExplainer";
import ApplicationReviewDrawerContent from "../content/ApplicationReviewDrawerContent";
import { useComponentContent } from "../content/ComponentContentContext";

const meta = {
  id: "pages-home-how-applying-works",
  title: "Components/Pages/Home/Sections/How applying works",
  component: HowApplyingWorksPanel,
  parameters: { standalone: true, catalog: { position: 1 }, layout: "fullscreen", docs: { description: { component: "Section heading, three application steps, illustrations and working review/QuickDecision help links." } } },
  decorators: [withHomeStoryFrame],
} satisfies Meta<typeof HowApplyingWorksPanel>;
export default meta;

function ApplyingWorksExample() {
  const [drawer, setDrawer] = useState<"review" | "quick-decision" | null>(null);
  const content = useComponentContent();
  return <>
    <HowApplyingWorksPanel variant="page" onOpenApplicationReview={() => setDrawer("review")} onOpenQuickDecision={() => setDrawer("quick-decision")} />
    <AppDrawer open={drawer !== null} onClose={() => setDrawer(null)} title={drawer === "review" ? content.help.applicationReview.title : content.help.howApplyingWorks.subDrawerTitles.quickDecision}>
      {drawer === "review" ? <ApplicationReviewDrawerContent onOpenQuickDecision={() => setDrawer("quick-decision")} /> : <QuickDecisionDrawerContent />}
    </AppDrawer>
  </>;
}
export const Default: StoryObj = { render: () => <ApplyingWorksExample /> };
