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

import advisorFixture from '../../requirements/global/prototype-fixtures/advisor.json';
import { requirementText } from '../domain/requirementContent';

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
          requirementText('confirmation.edit.announcement');
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const details = [
    { label: requirementText('confirmation.edit.recipient'), value: advisorFixture.email },
    {
      label: requirementText('confirmation.edit.sent'),
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
            {requirementText('confirmation.edit.message')}
          </Alert>

          <DetailsTable rows={details} />

          <Box>
            <Button
              variant="contained"
              startIcon={<HomeRoundedIcon />}
              onClick={() => navigate(getPagePath("home"))}
            >
              {requirementText('confirmation.edit.home')}
            </Button>
          </Box>
        </Stack>
      )}
    </FormRoutePage>
  );
}
