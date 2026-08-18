import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getPagePath } from "../config/pages";
import {
  getApplicantEmail,
  getApplicantName,
} from "../utils/applicantIdentity";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdvisorSendConfirmation() {
  const { values } = useApplicationForm();
  const navigate = useNavigate();

  const applicantName = getApplicantName(values) || "\u2014";
  const applicantEmail = getApplicantEmail(values) || "\u2014";

  const { sentDate, purgeDate } = useMemo(() => {
    const now = new Date();
    const purge = new Date(now);
    purge.setDate(purge.getDate() + 9);
    return { sentDate: now, purgeDate: purge };
  }, []);

  const details = [
    { label: "Applicant name", value: applicantName },
    { label: "Applicant email", value: applicantEmail },
    { label: "Sent for signature", value: formatDateTime(sentDate) },
    { label: "Scheduled for deletion", value: formatDateTime(purgeDate) },
  ];

  return (
    <FormRoutePage
      pageId="advisor-send-confirmation"
      hideActions
      // title="Sent for signature"
      // subhead="The application has successfully been sent to the applicant. They will receive an email with instructions to review and complete their electronic signature. Please see more details below."
    >
      {() => (
        <Stack spacing={3}>
          <Alert severity="success" icon={<SendRoundedIcon fontSize="small" />}>
            The application has been sent to the following applicant for review.
            You will be notified when the application is signed or if any edits
            are needed.
          </Alert>

          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableBody>
                {details.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        width: "40%",
                        fontSize: 13,
                      }}
                    >
                      {row.label}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineRoundedIcon />}
              onClick={() => navigate(getPagePath("advisor-login"))}
            >
              Start new application
            </Button>
          </Box>
        </Stack>
      )}
    </FormRoutePage>
  );
}
