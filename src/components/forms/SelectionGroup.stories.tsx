import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Checkbox, Radio, Stack, Typography } from "@mui/material";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import SelectionGroup from "./SelectionGroup";

/**
 * SelectionGroup is the shared bordered, clickable row underneath every
 * radio, checkbox, and icon-toggle option in the app (FieldRenderer's
 * radio/checkbox branches, CoverageCategorySelector, ResumeMethod, and
 * Beneficiary's hand-rolled radiogroup all build on it). It never renders a
 * label itself — callers place a native input (or nothing, for icon-toggle
 * rows) plus a `.SelectionGroup-label`-classed text node as children, and
 * the shared theme override (see Foundations/MUI Theme Overrides) styles
 * that label's weight/size globally.
 *
 * Selected-state styling comes from two different mechanisms depending on
 * whether a native input is present — see the two variants below.
 */
const meta = {
  title: "Forms/SelectionGroup",
  component: SelectionGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SelectionGroup>;

export default meta;

export const CheckboxRowUnselected: StoryObj = {
  name: "Checkbox row — unselected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup htmlFor="sg-checkbox-1">
        <Checkbox id="sg-checkbox-1" />
        <Typography className="SelectionGroup-label" component="span">
          I authorize this bank account for premium payments.
        </Typography>
      </SelectionGroup>
    </Box>
  ),
};

export const CheckboxRowSelected: StoryObj = {
  name: "Checkbox row — selected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup htmlFor="sg-checkbox-2">
        <Checkbox id="sg-checkbox-2" defaultChecked />
        <Typography className="SelectionGroup-label" component="span">
          I authorize this bank account for premium payments.
        </Typography>
      </SelectionGroup>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Selected via the theme's <code>&:has(:checked)</code> CSS — no
        JavaScript state needed for rows with a native input.
      </Typography>
    </Box>
  ),
};

export const RadioRow: StoryObj = {
  name: "Radio row (native-input mechanism)",
  render: () => {
    const [value, setValue] = useState("yes");
    return (
      <Box sx={{ maxWidth: 420 }}>
        <Stack spacing={1} role="radiogroup" aria-label="Do you use tobacco products?">
          {["yes", "no"].map((option) => (
            <SelectionGroup key={option} htmlFor={`sg-radio-${option}`}>
              <Radio
                id={`sg-radio-${option}`}
                checked={value === option}
                onChange={() => setValue(option)}
              />
              <Typography className="SelectionGroup-label" component="span" sx={{ textTransform: "capitalize" }}>
                {option}
              </Typography>
            </SelectionGroup>
          ))}
        </Stack>
      </Box>
    );
  },
};

export const IconToggleRowUnselected: StoryObj = {
  name: "Icon-toggle row (no native input) — unselected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup
        component="div"
        role="checkbox"
        aria-checked={false}
        tabIndex={0}
        checked={false}
        onClick={() => {}}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
      >
        <StarsRoundedIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          Life Insurance
        </Typography>
      </SelectionGroup>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Used by <code>CoverageCategorySelector</code>. Selected state is
        driven by the explicit <code>checked</code> prop (rendered as{" "}
        <code>data-checked="true"</code>) since there's no native input to
        key CSS off of — the caller owns Space/Enter activation via{" "}
        <code>onKeyDown</code>.
      </Typography>
    </Box>
  ),
};

export const IconToggleRowSelected: StoryObj = {
  name: "Icon-toggle row (no native input) — selected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup component="div" role="checkbox" aria-checked tabIndex={0} checked onClick={() => {}}>
        <StarsRoundedIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          Life Insurance
        </Typography>
      </SelectionGroup>
    </Box>
  ),
};

export const FocusVisible: StoryObj = {
  name: "Keyboard focus",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        Tab to the row below to see the focus-visible outline (
        <code>2px solid primary.main</code>, offset 2px) — this applies to
        every SelectionGroup row, native-input or icon-toggle alike.
      </Typography>
      <SelectionGroup component="div" role="checkbox" aria-checked={false} tabIndex={0} checked={false} onClick={() => {}}>
        <StarsRoundedIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          Tab here
        </Typography>
      </SelectionGroup>
    </Box>
  ),
};
