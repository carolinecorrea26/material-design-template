import * as React from "react";
import { Box, Container, Stack, Typography, Card, CardContent } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useAppData } from "../state/AppDataContext";
import { commonStyles } from "../theme/commonStyles";

export default function AdvisorSuccess() {
  const { data } = useAppData();
  const eligibility = data.eligibility;
  
  const submissionDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 6 }}>
        {/* Success Icon and Message */}
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircle 
            sx={{ 
              fontSize: 80, 
              color: 'success.main',
              mb: 2
            }} 
          />
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Application Sent Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            An email has been sent to the applicant for signature.
          </Typography>
        </Box>

        {/* Applicant Details Card */}
        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Applicant Details
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
                <Typography variant="body2" sx={{ width: '180px', fontWeight: 500 }}>
                  Applicant Name:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {eligibility?.firstName} {eligibility?.middleInitial && `${eligibility.middleInitial}. `}{eligibility?.lastName} {eligibility?.suffix}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
                <Typography variant="body2" sx={{ width: '180px', fontWeight: 500 }}>
                  Applicant Email:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {eligibility?.email}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
                <Typography variant="body2" sx={{ width: '180px', fontWeight: 500 }}>
                  Date Submitted:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {submissionDate}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            The applicant will receive an email with instructions to complete their electronic signature. 
            Once signed, the application will be submitted for processing.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
