import type { Meta, StoryObj } from "@storybook/react-vite";
import PageTransitionSkeleton from "./PageTransitionSkeleton";

/**
 * PageTransitionSkeleton is shown by FormRoutePage while the next page is
 * being resolved/transitioned to. The visible skeleton bars and message are
 * both `aria-hidden` — the outer `role="status"` region only exposes the
 * `aria-label`, so screen readers hear one announcement instead of the
 * message text and the decorative bars both.
 */
const meta = {
  title: "Feedback/PageTransitionSkeleton",
  component: PageTransitionSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageTransitionSkeleton>;

export default meta;

export const WithMessage: StoryObj = {
  render: () => <PageTransitionSkeleton message="Loading your coverage options…" />,
};

export const NoMessage: StoryObj = {
  render: () => <PageTransitionSkeleton />,
};
