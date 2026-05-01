import { Box, Typography } from "@mui/material";

type FormPageTitleProps = {
  title: string;
};

export default function FormPageTitle({ title }: FormPageTitleProps) {
  return (
    <Box>
      <Typography
        component="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.25rem", md: "1.75rem" },
          lineHeight: 1.35,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
