import { useCallback, useState } from "react";

/**
 * Centralizes the column-width state + resize callback every resizable
 * table needs (pair with ResizableHeaderCell for the header cells and a
 * matching <colgroup> — see Effective Fields in ClientSiteDetailsPanel for
 * the reference shape). One instance per table; keys are that table's
 * column identifiers.
 */
export default function useResizableColumns<K extends string>(initialWidths: Record<K, number>) {
  const [widths, setWidths] = useState(initialWidths);

  const resize = useCallback((key: K, nextWidth: number) => {
    setWidths((prev) => ({ ...prev, [key]: nextWidth }));
  }, []);

  return { widths, resize };
}
