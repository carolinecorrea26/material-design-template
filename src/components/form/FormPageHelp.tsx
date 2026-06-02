import { useMemo, useState, type ReactNode } from "react";
import FormHelpChips, { type HelpChipItem } from "./FormHelpChips";
import FormHelpDrawer from "./FormHelpDrawer";

export type FormPageHelpItem = HelpChipItem & {
  title: ReactNode;
  content: ReactNode;
};

type FormPageHelpProps = {
  items: FormPageHelpItem[];
  beforeChips?: ReactNode;
};

export default function FormPageHelp({
  items,
  beforeChips,
}: FormPageHelpProps) {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);

  const activeHelpItem = useMemo(
    () => items.find((item) => item.id === activeHelpId) ?? null,
    [activeHelpId, items],
  );

  if (!items.length && !beforeChips) return null;

  return (
    <>
      {beforeChips}

      {items.length ? (
        <>
          <FormHelpChips items={items} onSelect={setActiveHelpId} />
          <FormHelpDrawer
            open={Boolean(activeHelpItem)}
            title={activeHelpItem?.title ?? ""}
            onClose={() => setActiveHelpId(null)}
          >
            {activeHelpItem?.content}
          </FormHelpDrawer>
        </>
      ) : null}
    </>
  );
}
