import { Card, Stack, TextField, Typography } from "@mui/material";

type SignatureCompletionSectionProps = {
  signatureName: string;
  signedDate: string;
  onSignatureNameChange: (value: string) => void;
};

export default function SignatureCompletionSection({
  signatureName,
  signedDate,
  onSignatureNameChange,
}: SignatureCompletionSectionProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        position: { lg: "sticky" },
        top: { lg: 24 },
        borderRadius: 2,
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Complete Signature</Typography>
          <Typography variant="body2" color="text.secondary">
            Type your full legal name to apply a mock electronic signature to
            the application preview.
          </Typography>
        </Stack>

        <TextField
          label="Full Name"
          value={signatureName}
          onChange={(event) => onSignatureNameChange(event.target.value)}
          autoComplete="name"
          fullWidth
        />

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Signature Preview
          </Typography>
          <Stack
            spacing={1}
            sx={{
              minHeight: 112,
              p: 2,
              border: "1px dashed rgba(0, 0, 0, 0.22)",
              borderRadius: 1.5,
              backgroundColor: "#fafafa",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{
                minHeight: 44,
                fontSize: "2rem",
                lineHeight: 1.1,
                color: signatureName.trim() ? "text.primary" : "text.disabled",
                fontFamily: '"Brush Script MT", "Segoe Script", cursive',
              }}
            >
              {signatureName.trim() || "Type name to sign"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Signed date: {signedDate || "--/--/----"}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}