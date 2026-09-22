import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Stack, Typography } from "@mui/material";
import ConditionalGroup from "./ConditionalGroup";
import FieldRenderer from "./FieldRenderer";

/**
 * ConditionalGroup is a pure visual wrapper — a left-bordered, indented
 * container marking follow-up content as conditional on a prior answer. It
 * owns no show/hide logic itself; the parent decides when to render it (its
 * parent decides when to render it. Health pages use YesNoDetailList for the
 * related numbered-question + repeatable-details pattern.
 */
const meta = {
  title: "Forms/ConditionalGroup",
  component: ConditionalGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ConditionalGroup>;

export default meta;

type DemoValues = Record<string, string | boolean | string[]>;

export const HiddenAndRevealed: StoryObj = {
  name: "Hidden vs. revealed (interactive)",
  render: () => {
    const { control, formState } = useForm<DemoValues>({
      defaultValues: { "uses-tobacco": "no", "tobacco-frequency": "" },
    });
    const [answer, setAnswer] = useState<"yes" | "no">("no");

    return (
      <Box sx={{ maxWidth: 460 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Toggle the question below — the follow-up field only exists in the
          DOM once "Yes" is selected. There is no hidden/collapsed markup
          left behind for "No".
        </Typography>
        <Stack spacing={1} direction="row" sx={{ mb: 2 }}>
          <button type="button" onClick={() => setAnswer("no")} aria-pressed={answer === "no"}>
            Answer: No
          </button>
          <button type="button" onClick={() => setAnswer("yes")} aria-pressed={answer === "yes"}>
            Answer: Yes
          </button>
        </Stack>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Do you use tobacco products?
        </Typography>
        {answer === "yes" && (
          <ConditionalGroup>
            <FieldRenderer
              field={{
                id: "tobacco-frequency",
                label: "How often?",
                inputType: "dropdown",
                required: true,
                options: [
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "A few times a week" },
                  { value: "rarely", label: "Rarely" },
                ],
              }}
              control={control}
              errors={formState.errors}
            />
          </ConditionalGroup>
        )}
      </Box>
    );
  },
};

export const NestedContent: StoryObj = {
  name: "Arbitrary nested content",
  render: () => (
    <Box sx={{ maxWidth: 460 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        ConditionalGroup accepts any children — not just a single field.
      </Typography>
      <ConditionalGroup>
        <Stack spacing={1}>
          <Typography variant="body2">
            Multiple related follow-up fields, grouped under one border.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            (Placeholder content — a real usage would render several
            FieldRenderer instances here, as CoverageQuestions.tsx does.)
          </Typography>
        </Stack>
      </ConditionalGroup>
    </Box>
  ),
};

export const AccessibilityNote: StoryObj = {
  name: "Accessibility note",
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="body2" color="text.secondary">
        ConditionalGroup itself has no ARIA — it's a plain <code>Box</code>{" "}
        with a colored left border, not a live region. Any announcement that
        new content appeared is the parent's responsibility (e.g. the
        revealed content should be reachable in tab order immediately after
        the controlling question, and if the reveal is significant enough to
        need an explicit announcement, that's a <code>role="status"</code>{" "}
        the parent adds — ConditionalGroup does not add one on its own).
        This is a real, current limitation, not a design decision to
        document as a feature.
      </Typography>
    </Box>
  ),
};
