import { Box, Stack, Typography } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AppModal from "./AppModal";

type SendApplicationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * Optional title override for the modal.
   */
  title?: string;
  /**
   * Intro text shown above recipient details.
   */
  introText?: string;
  /**
   * Whether to display the recipient name row.
   */
  showRecipientName?: boolean;
  /**
   * Optional recipient name shown in the dialog details block.
   */
  recipientName?: string;
  /**
   * The email address of the recipient this application is being sent to.
   */
  recipientEmail: string;
  /**
   * Short label for the recipient shown in the dialog title, e.g. "applicant" or "advisor".
   */
  recipientLabel?: string;
};

/**
 * Reusable confirmation dialog shown before sending an application to a recipient.
 *
 * Used in:
 * - Advisor → Applicant handoff (Profile page next → advisor-send-confirmation)
 * - Applicant → Advisor edit return (review edit → application-edit-confirmation)
 */
export default function SendApplicationDialog(
  props: SendApplicationDialogProps,
) {
  const {
    open,
    onClose,
    onConfirm,
    title,
    introText,
    showRecipientName = true,
    recipientName,
    recipientEmail,
    recipientLabel = "applicant",
  } = props;
  const resolvedTitle = title ?? `Send application to ${recipientLabel}?`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth={480}
      minHeight="auto"
      role="alertdialog"
      title={resolvedTitle}
      actions={[
        {
          label: "Send",
          onClick: onConfirm,
          variant: "contained",
        },
        {
          label: "Cancel",
          onClick: onClose,
          variant: "text",
        },
      ]}
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {introText ??
            "The application will be sent to the following email address:"}
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "background.default",
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <SendRoundedIcon
              sx={{ color: "primary.main", fontSize: 20, display: "block" }}
            />
          </Box>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            {showRecipientName ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {recipientName?.trim() || "—"}
                </Typography>
              </>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              Email
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, wordBreak: "break-all" }}
            >
              {recipientEmail || "—"}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </AppModal>
  );
}
