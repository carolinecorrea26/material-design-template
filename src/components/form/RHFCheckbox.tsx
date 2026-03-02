import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, Box, Typography } from "@mui/material";

export default function RHFCheckbox({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box
          component="label"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.5,
            width: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            bgcolor: "white",
            cursor: "pointer",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
            "@media (hover: hover)": {
              "&:hover": {
                backgroundColor: "action.hover",
              },
            },
          }}
        >
          <Checkbox
            checked={!!field.value}
            onChange={(_, v) => field.onChange(v)}
            onBlur={field.onBlur}
            name={field.name}
            disableRipple
            sx={{
              p: 0,
              color: "text.primary",
              "&.Mui-checked": { color: "primary.main" },
              "&:hover": { backgroundColor: "action.hover" },
              "&.Mui-checked:hover": { backgroundColor: "action.hover" },
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
            {label}
          </Typography>
        </Box>
      )}
    />
  );
}
