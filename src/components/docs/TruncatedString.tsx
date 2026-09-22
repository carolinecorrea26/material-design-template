import { useState } from "react";
import { Box, Link, Typography } from "@mui/material";

const DEFAULT_LONG_STRING_THRESHOLD = 180;

export default function TruncatedString({
  value,
  threshold = DEFAULT_LONG_STRING_THRESHOLD,
}: {
  value: string;
  threshold?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > threshold;
  const display = isLong && !expanded ? `${value.slice(0, threshold)}…` : value;

  return (
    <Box>
      <Typography
        component="span"
        sx={{
          // fontFamily: "monospace",
          fontSize: "0.8125rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {display}
      </Typography>
      {isLong && (
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => setExpanded((v) => !v)}
          sx={{ ml: 1, fontSize: "0.75rem", verticalAlign: "baseline" }}
        >
          {expanded ? "Show less" : "Show more"}
        </Link>
      )}
    </Box>
  );
}
