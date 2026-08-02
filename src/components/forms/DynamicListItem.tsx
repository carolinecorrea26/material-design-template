import type { ReactNode } from "react";
import { Box, Button, Stack } from "@mui/material";

type DynamicListItemProps = {
  children: ReactNode;
  onEdit: () => void;
  onRemove: () => void;
  /** Used in the accessible label for the Remove button, e.g. "John Smith (50%)".
   *  Results in aria-label "Remove John Smith (50%)" so screen readers distinguish
   *  items when multiple are present. */
  itemLabel?: string;
};

export default function DynamicListItem({
  children,
  onEdit,
  onRemove,
  itemLabel,
}: DynamicListItemProps) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        // backgroundColor: "background.surface",
        borderRadius: 1.5,
        px: 2,
        py: 1.5,
        mb: 1.5,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>

        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Button
            size="small"
            onClick={onEdit}
            aria-label={itemLabel ? `Edit ${itemLabel}` : undefined}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={onRemove}
            color="error"
            aria-label={itemLabel ? `Remove ${itemLabel}` : undefined}
          >
            Remove
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
