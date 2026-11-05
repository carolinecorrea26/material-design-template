import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Box, Link } from "@mui/material";

/** Measure the rendered content so lists, links and prose share one treatment. */
export default function ExpandableCell({ children }: { children: ReactNode }) {
  const id = useId();
  const content = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const measure = () => setOverflows(element.scrollHeight > 100);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [children]);
  return <Box>
    <Box id={id} ref={content} onFocusCapture={() => { if (overflows) setExpanded(true); }} sx={{ maxHeight: expanded ? "none" : 100, overflow: "hidden" }}>{children}</Box>
    {overflows && <Link component="button" type="button" aria-expanded={expanded} aria-controls={id}
      onClick={() => setExpanded(value => !value)} sx={{ mt: 0.5, fontSize: "0.8125rem", textAlign: "left" }}>
      {expanded ? "Show less" : "Show more"}
    </Link>}
  </Box>;
}
