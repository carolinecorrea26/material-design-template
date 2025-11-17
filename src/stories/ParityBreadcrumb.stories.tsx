import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ParityBreadcrumb } from "../components/parity";

const meta: Meta<typeof ParityBreadcrumb> = {
  title: "Parity/Breadcrumb & Stepper",
  component: ParityBreadcrumb
};
export default meta;
type Story = StoryObj<typeof ParityBreadcrumb>;

export const Stepper: Story = {
  args: {
    variant: "stepper",
    currentIndex: 2,
    numericSteps: true,
    items: [
      { label: "Eligibility", to: "/eligibility" },
      { label: "Coverage", to: "/coverage" },
      { label: "Contact", to: "/contact" },
      { label: "Profile", to: "/profile" },
      { label: "Preview", to: "/preview" }
    ]
  }
};

export const BreadcrumbsTrail: Story = {
  args: {
    variant: "breadcrumbs",
    items: [
      { label: "Home", to: "/" },
      { label: "Application", to: "/eligibility" },
      { label: "Profile" } // current
    ]
  }
};
