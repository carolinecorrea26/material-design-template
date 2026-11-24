import { useLayoutEffect, type RefObject } from 'react';
import type { Size } from './layout';

/** offset sizes are canvas-independent; transformed client rectangles include zoom. */
export function useFlowMeasurement(ref: RefObject<HTMLElement | null>, report?: (size: Size) => void) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !report) return;
    const measure = () => { if (element.offsetWidth && element.offsetHeight) report({ width: element.offsetWidth, height: element.offsetHeight }); };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    let active = true;
    void document.fonts?.ready.then(() => { if (active) measure(); });
    return () => { active = false; observer?.disconnect(); };
  }, [ref, report]);
}
