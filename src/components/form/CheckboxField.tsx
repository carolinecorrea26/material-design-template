import * as React from "react";
import { Checkbox, Box, Typography } from "@mui/material";

type CheckboxFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  name?: string;
  disabled?: boolean;
};

export default function CheckboxField({
  checked,
  onChange,
  label,
  name,
  disabled,
}: CheckboxFieldProps) {
  const renderedLabel =
    typeof label === "string" ? (
      <Typography variant="body2" sx={{ fontWeight: 400 }}>
        {label}
      </Typography>
    ) : (
      label
    );

  return (
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
        cursor: disabled ? "default" : "pointer",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        "@media (hover: hover)": {
          "&:hover": {
            backgroundColor: disabled ? "inherit" : "action.hover",
          },
        },
      }}
    >
      <Checkbox
        checked={checked}
        onChange={(_, value) => onChange(value)}
        name={name}
        disabled={disabled}
        disableRipple
        sx={{
          p: 0,
          color: "text.primary",
          "&.Mui-checked": { color: "primary.main" },
          "&:hover": { backgroundColor: "action.hover" },
          "&.Mui-checked:hover": { backgroundColor: "action.hover" },
        }}
      />
      {renderedLabel}
    </Box>
  );
}
