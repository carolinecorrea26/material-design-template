import * as React from "react";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { Draw as DrawIcon } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";
import { getProducts } from "../api/client";
import type { Product } from "../types/app";
import { getHealthFlow } from "../utils/healthFlow";

export default function DocuSign() {
  const { data } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<Product[]>([]);

  const [signature, setSignature] = React.useState("");
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products", err);
      });
  }, []);

  const handleContinue = () => {
    setSubmitAttempted(true);

    if (!signature.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const { routes } = getHealthFlow(data.coverage, products);
    markComplete();
    navigate(routes[0] ?? "/decision");
  };

  const hasError = submitAttempted && !signature.trim();

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Sign Your Application"
        notes="Please review and sign your application to complete the submission process."
      />

      {hasError && (
        <Alert severity="error">
          Please provide your signature to continue.
        </Alert>
      )}

      {/* DocuSign Mock Interface */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={3}>
            {/* DocuSign Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                pb: 2,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <DrawIcon color="primary" fontSize="large" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                DocuSign
              </Typography>
            </Box>

            <Alert severity="info">
              This is a demonstration of the DocuSign integration. In
              production, this would be replaced with the actual DocuSign
              embedded signing experience.
            </Alert>

            {/* Document Summary */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Document to Sign
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Insurance Application - New York Life
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Application Number: {Math.floor(Math.random() * 1000000000)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Applicant: {data.eligibility?.firstName}{" "}
                  {data.eligibility?.lastName}
                </Typography>
              </Box>
            </Box>

            {/* Signature Section */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Your Signature Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please type your full name below. This will serve as your
                electronic signature.
              </Typography>

              <TextField
                fullWidth
                label="Type Your Full Name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="John Doe"
                required
                error={hasError}
                helperText={hasError ? "Signature is required" : ""}
                sx={{
                  "& input": {
                    fontFamily: "'Brush Script MT', cursive",
                    fontSize: "1.5rem",
                  },
                }}
              />

              {signature && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Preview:
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontFamily: "'Brush Script MT', cursive",
                      color: "primary.main",
                      mt: 1,
                    }}
                  >
                    {signature}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Legal Disclaimer */}
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                By clicking "Finish" below, I agree that the signature and
                initials will be the electronic representation of my signature
                and initials for all purposes when I (or my agent) use them on
                documents, including legally binding contracts - just the same
                as a pen-and-paper signature or initial.
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                pt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/application-review")}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleContinue}
                disabled={!signature.trim()}
              >
                Finish
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
