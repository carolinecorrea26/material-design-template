import { Box, Container, Typography } from "@mui/material";
import { commonStyles } from "../../theme/commonStyles";

export default function Footer() {
  return (
    <Box component="footer" sx={commonStyles.footer}>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © New York Life — Legal & disclosures (placeholder) · TPA contact info (placeholder)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
