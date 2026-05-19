import { Box, Typography } from "@mui/material";

type FormPageTitleProps = {
  title: string;
  compact?: boolean;
};

export default function FormPageTitle({ title, compact }: FormPageTitleProps) {
  if (compact) {
    return (
      <Box>
        <Typography
          component="p"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1rem", md: "1.125rem" },
            lineHeight: 1.5,
          }}
        >
          {title}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        component="h1"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "1.25rem", md: "1.75rem" },
          lineHeight: 1.35,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
