import * as React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Box,
  Alert,
  Divider,
} from "@mui/material";
import {
  Download as DownloadIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import { Link as RouterLink } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";

export default function Receipt() {
  const confirmationNumber = `133333485148`;

  const handleDownloadApplication = () => {
    // Mock download action
    console.log("Downloading QuickDecision PDF...");
  };

  const handleDownloadPayment = () => {
    // Mock download action
    console.log("Downloading Payment Information PDF...");
  };

  return (
    <Stack spacing={3}>
      <PageHeader 
        title="Thank you! Your application has been submitted." 
        notes={
          <>
            Confirmation # <Box component="span" sx={{ fontWeight: 600, color: "primary.main" }}>{confirmationNumber}</Box>
          </>
        }
      />

      {/* Next Steps, Download Application */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* <ArrowForwardIcon color="primary" /> */}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Next Step
              </Typography>
            </Box>

            <Typography variant="body2">
              Your information has been securely sent to the plan administrator for review. You may be contacted about your application for further details. Your information will only be shared with representatives who have a direct relevant business need to process your application. Please contact your plan administrator if you need to make any changes to your application.
            </Typography>

          </Stack>

          <Stack spacing={3} sx={{ mt: 5 }}>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* <DownloadIcon color="primary" /> */}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Download Your Application
              </Typography>
            </Box>

            <Typography variant="body2">
              While you will receive a confirmation email, it will include your identification number only. Please download your application documentation now using the links below. (This documentation will not be sent by email for security reasons.)
            </Typography>

            <Divider />

            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadApplication}
                fullWidth
              >
                Download QuickDecision℠ PDF
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPayment}
                fullWidth
              >
                Download Payment Information PDF
              </Button>
            </Stack>

            {/* <Alert severity="info">
              Please save these documents for your records. You will not be able to access them after leaving this page.
            </Alert> */}

          </Stack>

   
        </CardContent>
      </Card>
    </Stack>
  );
}

