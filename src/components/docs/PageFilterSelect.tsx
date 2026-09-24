import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useId } from "react";

export const ALL_PAGES = "__all_pages__";

export type PageFilterOption = {
  value: string;
  label: string;
};

export default function PageFilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PageFilterOption[];
}) {
  const labelId = useId();

  useEffect(() => {
    if (value !== ALL_PAGES && !options.some((option) => option.value === value)) {
      onChange(ALL_PAGES);
    }
  }, [onChange, options, value]);

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel id={labelId}>Page</InputLabel>
      <Select
        labelId={labelId}
        label="Page"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value={ALL_PAGES}>All pages</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
