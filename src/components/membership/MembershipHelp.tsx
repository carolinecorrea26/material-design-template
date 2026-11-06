import { useState } from "react";
import FormHelpChips from "../content/HelpChips";
import AppDrawer from "../layout/AppDrawer";
import { pageHelpChips } from "../../content/interactionLabels";

/** The membership page's coverage and applying help actions. */
export default function MembershipHelp({ drawerHelpItems = [] }: {
  drawerHelpItems?: { id: string; title: import("react").ReactNode; content: import("react").ReactNode }[];
}) {
  const chipItems = [...pageHelpChips.membership];
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    drawerHelpItems.find((item) => item.id === activeHelpId) ?? null;

  return (
    <>
      <FormHelpChips items={chipItems} onSelect={setActiveHelpId} />
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
