import { useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { getPagePath } from "../config/pages";
import DetailsTable from "../components/layout/DetailsTable";

// Dummy advisor email used until a real advisor record is available
const ADVISOR_DUMMY_EMAIL = "advisor@example.com";

/**
 * Confirmation page shown to the applicant after they request the advisor to
 * make edits from the review experience.
 *
 * Mirrors AdvisorSendConfirmation but shows the advisor email as the
 * recipient rather than the applicant email.
 */
export default function ApplicationEditConfirmation() {
  const navigate = useNavigate();
  const sentDate = new Date();
  const announcementRef = useRef<HTMLDivElement>(null);

  // This page is reached via a direct client-side navigate() from the Review
  // page's "send back to advisor" dialog, which (unlike the normal Next-button
  // flow) does not pass through RoutePage's transition announcement. Populate
  // the live region imperatively (after mount) so screen readers announce
  // arrival instead of staying silent.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent =
          "Your request has been sent to your advisor.";
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const details = [
    { label: "Sent to advisor", value: ADVISOR_DUMMY_EMAIL },
    {
      label: "Request sent",
      value: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(sentDate),
    },
  ];

  return (
    <FormRoutePage pageId="application-edit-confirmation" hideActions>
      {() => (
        <Stack spacing={3}>
          <Box
            ref={announcementRef}
            role="status"
            aria-live="polite"
            sx={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
            }}
          />
          <Alert severity="success" icon={<UndoRoundedIcon fontSize="small" />}>
            Your advisor will contact you regarding the required updates to your
            application. They will review the changes with you and return the
            application once the updates have been completed.
          </Alert>

          <DetailsTable rows={details} />

          <Box>
            <Button
              variant="contained"
              startIcon={<HomeRoundedIcon />}
              onClick={() => navigate(getPagePath("home"))}
            >
              Return to Home
            </Button>
          </Box>
        </Stack>
      )}
    </FormRoutePage>
  );
}
