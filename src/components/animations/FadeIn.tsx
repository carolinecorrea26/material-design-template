import * as React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

export type FadeInTrigger = "immediate" | "viewport";

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  trigger?: FadeInTrigger;
  once?: boolean;
  viewportAmount?: number;
}

/**
 * Reusable fade-and-rise animation wrapper.
 * Use trigger="viewport" for scroll-based reveals, otherwise it animates on mount.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 24,
  trigger = "immediate",
  once = true,
  viewportAmount = 0.3,
  style,
  ...rest
}: FadeInProps) {
  const variants = React.useMemo<Variants>(() => ({
    hidden: { opacity: 0, y: yOffset },
    visible: { opacity: 1, y: 0 }
  }), [yOffset]);

  const motionProps =
    trigger === "viewport"
      ? {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: { once, amount: viewportAmount }
        }
      : {
          initial: "hidden" as const,
          animate: "visible" as const
        };

  return (
    <motion.div
      variants={variants}
      transition={{ duration, delay, ease: "easeOut" }}
      style={style}
      {...motionProps}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
