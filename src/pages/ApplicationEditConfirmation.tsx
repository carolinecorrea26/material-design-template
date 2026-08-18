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
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { getPagePath } from "../config/pages";

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
          <Alert severity="success" icon={<UndoRoundedIcon fontSize="small" />}>
            Your advisor will contact you regarding the required updates to your
            application. They will review the changes with you and return the
            application once the updates have been completed.
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
