import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import RadioSelectionGroup from "../components/forms/RadioSelectionGroup";
import { getPagePath, getPageTitle } from "../config/pages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";

export default function ResumeMethod() {
  const navigate = useNavigate();
  const fields = getClientPageFields("resume-method");
  const methodField = fields.find(
    (field) => field.id === "resume-delivery-method",
  );

  const [deliveryMethod, setDeliveryMethod] = useState<string>("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deliveryMethod) return;

    navigate(getPagePath("resume-code"), {
      state: { deliveryMethod },
    });
  }

  return (
    <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
      <PageShell title={getPageTitle("resume-method")} maxWidth={600} noTitle>
        <FormShell
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <PageHeader
              title={getPageTitle("resume-method")}
              subhead={
                <>
                  Choose how you would like to receive your verification code
                  for the phone number{" "}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    (•••)•••1111
                  </Box>
                  .
                </>
              }
          />

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ py: 1 }}
          >
            <RadioSelectionGroup
              name="resume-delivery-method"
              label={methodField?.label ?? "Delivery method"}
              options={methodField?.options ?? []}
              value={deliveryMethod}
              onChange={setDeliveryMethod}
              required={methodField?.required}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 3,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!deliveryMethod}
              >
                Next
              </Button>
            </Box>
          </Box>
        </FormShell>
      </PageShell>
    </Box>
  );
}
