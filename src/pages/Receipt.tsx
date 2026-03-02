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

const AnimatedCheckmark = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        my: 2,
        "@keyframes scaleIn": {
          "0%": { transform: "scale(0)", opacity: 0 },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        "@keyframes drawCheck": {
          "0%": { strokeDashoffset: 48 },
          "100%": { strokeDashoffset: 0 },
        },
        "@keyframes drawCircle": {
          "0%": { strokeDashoffset: 166 },
          "100%": { strokeDashoffset: 0 },
        },
      }}
    >
      <Box
        component="svg"
        width="80px"
        height="80px"
        viewBox="0 0 52 52"
        sx={{
          animation: "scaleIn 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          "& .checkmark__circle": {
            strokeDasharray: 166,
            strokeDashoffset: 166,
            strokeWidth: 2,
            stroke: "#4caf50",
            fill: "none",
            animation:
              "drawCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards",
          },
          "& .checkmark__check": {
            transformOrigin: "50% 50%",
            strokeDasharray: 48,
            strokeDashoffset: 48,
            strokeWidth: 3,
            stroke: "#4caf50",
            fill: "none",
            animation:
              "drawCheck 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards",
          },
        }}
      >
        <circle className="checkmark__circle" cx="26" cy="26" r="25" />
        <path className="checkmark__check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </Box>
    </Box>
  );
};

export default function Receipt() {
  const confirmationNumber = `133333485148`;

  const handleDownloadApplication = () => {};

  const handleDownloadPayment = () => {};

  return (
    <Stack spacing={3}>
      <AnimatedCheckmark />

      <PageHeader
        title="Thank you! Your application has been submitted."
        notes={
          <>
            Confirmation #{" "}
            <Box
              component="span"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              {confirmationNumber}
            </Box>
          </>
        }
        centered
      />

      {/* Next Steps, Download Application */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Next Step
              </Typography>
            </Box>

            <Typography variant="body2">
              Your information has been securely sent to the plan administrator
              for review. You may be contacted about your application for
              further details. Your information will only be shared with
              representatives who have a direct relevant business need to
              process your application. Please contact your plan administrator
              if you need to make any changes to your application.
            </Typography>
          </Stack>

          <Stack spacing={3} sx={{ mt: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Download Your Application
              </Typography>
            </Box>

            <Typography variant="body2">
              While you will receive a confirmation email, it will include your
              identification number only. Please download your application
              documentation now using the links below. (This documentation will
              not be sent by email for security reasons.)
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
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
