import type { ReactNode } from "react";
import { Box, Button, Stack } from "@mui/material";

type AddListItemProps = {
  children: ReactNode;
  onEdit: () => void;
  onRemove: () => void;
};

export default function AddListItem({
  children,
  onEdit,
  onRemove,
}: AddListItemProps) {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.04)",
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
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>
          <Button size="small" onClick={onRemove} color="error">
            Remove
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
