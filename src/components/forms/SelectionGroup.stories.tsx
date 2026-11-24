// Preview notes are documentation only; the canvas contains application UI.
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Checkbox, Radio, Stack, Typography } from "@mui/material";
import { resolveMappedFields } from '../../domain/requirementFields';
import { coverageCategories } from '../../config/coverageCategories';
const lifeCategory = coverageCategories.find(category => category.id === 'LI')!;
const LifeIcon = lifeCategory.icon;
const bank = resolveMappedFields({ page: 'payment' }).find(field => field.id === 'bank-authorization')!;
const tobacco = resolveMappedFields({ component: 'quote-calculator' }).find(field => field.id === 'smoker')!;
import SelectionGroup from "./SelectionGroup";

/** Shared option-row surface used by the renderer's radio and checkbox primitives.
 * These examples exercise the primitive itself; application fields use FieldRenderer. */
const meta = {
  id: "forms-selectiongroup",
  title: "Components/Forms/Selection rows/Checkbox and toggle rows",
  component: SelectionGroup,
  parameters: { standalone: true, docs: { description: { component: "Provides a selectable row or card with the shared selection styling." } }, layout: "padded" },
} satisfies Meta<typeof SelectionGroup>;

export default meta;

export const CheckboxRowUnselected: StoryObj = {
  name: "Checkbox row — unselected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup htmlFor="sg-checkbox-1">
        <Checkbox id="sg-checkbox-1" />
        <Typography className="SelectionGroup-label" component="span">
          {bank.label}
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
          {bank.label}
        </Typography>
      </SelectionGroup>

    </Box>
  ),
};

export const RadioRow: StoryObj = {
  name: "Radio row (native-input mechanism)",
  render: () => {
    const [value, setValue] = useState("yes");
    return (
      <Box sx={{ maxWidth: 420 }}>
        <Stack spacing={1} role="radiogroup" aria-label={tobacco.label}>
          {tobacco.options!.map(({ value: option, label }) => (
            <SelectionGroup key={option} htmlFor={`sg-radio-${option}`}>
              <Radio
                id={`sg-radio-${option}`}
                checked={value === option}
                onChange={() => setValue(option)}
              />
              <Typography className="SelectionGroup-label" component="span" sx={{ textTransform: "capitalize" }}>
                {label}
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
        <LifeIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          {lifeCategory.label}
        </Typography>
      </SelectionGroup>

    </Box>
  ),
};

export const IconToggleRowSelected: StoryObj = {
  name: "Icon-toggle row (no native input) — selected",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <SelectionGroup component="div" role="checkbox" aria-checked tabIndex={0} checked onClick={() => {}}>
        <LifeIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          {lifeCategory.label}
        </Typography>
      </SelectionGroup>
    </Box>
  ),
};

export const FocusVisible: StoryObj = {
  name: "Keyboard focus",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>

      <SelectionGroup component="div" role="checkbox" aria-checked={false} tabIndex={0} checked={false} onClick={() => {}}>
        <LifeIcon className="SelectionGroup-icon" />
        <Typography className="SelectionGroup-label" component="span">
          {lifeCategory.label}
        </Typography>
      </SelectionGroup>
    </Box>
  ),
};
