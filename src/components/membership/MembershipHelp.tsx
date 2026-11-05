import { useState } from "react";
import FormHelpChips from "../content/HelpChips";
import AppDrawer from "../layout/AppDrawer";
import { pageHelpChips } from "../../content/interactionLabels";

/** The membership page's coverage, applying and estimate help actions. */
export default function MembershipHelp({ drawerHelpItems = [], onEstimate }: {
  drawerHelpItems?: { id: string; title: import("react").ReactNode; content: import("react").ReactNode }[];
  onEstimate?: () => void;
}) {
  const chipItems = [...pageHelpChips.membership];
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    drawerHelpItems.find((item) => item.id === activeHelpId) ?? null;

  function handleHelpSelect(id: string) {
    if (id === "estimate-cost") {
      onEstimate?.();
    } else {
      setActiveHelpId(id);
    }
  }

  return (
    <>
      <FormHelpChips items={chipItems} onSelect={handleHelpSelect} />
      <AppDrawer
        open={!!activeHelpItem}
        title={activeHelpItem?.title ?? ""}
        onClose={() => setActiveHelpId(null)}
      >
        {activeHelpItem?.content}
      </AppDrawer>

    </>
  );
}
