import * as React from "react";
import { ParityDialog } from "../parity";

export function useConfirm() {
  const [state, setState] = React.useState<{ open: boolean; title: string; resolve?: (v:boolean)=>void }>({
    open: false, title: ""
  });

  const confirm = (title: string) =>
    new Promise<boolean>((resolve) => setState({ open: true, title, resolve }));

  const Dialog = (
    <ParityDialog
      open={state.open}
      title={state.title}
      onClose={() => { state.resolve?.(false); setState(s => ({ ...s, open: false })); }}
      primaryAction={{ label: "Confirm", onClick: () => { state.resolve?.(true); setState(s => ({ ...s, open: false })); } }}
      secondaryAction={{ label: "Cancel", onClick: () => { state.resolve?.(false); setState(s => ({ ...s, open: false })); } }}
    />
  );

  return { confirm, Dialog };
}
