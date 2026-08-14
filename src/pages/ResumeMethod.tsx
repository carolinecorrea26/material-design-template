import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageTitle from "../components/layout/PageTitle";
import FormShell from "../components/layout/FormShell";
import SelectionGroup from "../components/forms/SelectionGroup";
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
    <Stack
      spacing={2}
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <FormShell
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <PageTitle
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
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ py: 1 }}
          >
            <FormControl fullWidth>
              <FormLabel
                required={methodField?.required}
                sx={{ display: "block", mb: 1 }}
                id="resume-delivery-method-label"
              >
                {methodField?.label}
              </FormLabel>

              <Box
                role="radiogroup"
                aria-labelledby="resume-delivery-method-label"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  gap: 1,
                  mt: 1,
                }}
              >
                {(methodField?.options ?? []).map((option) => {
                  const checked = deliveryMethod === option.value;
                  return (
                    <SelectionGroup
                      key={option.value}
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      onClick={() => setDeliveryMethod(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setDeliveryMethod(option.value);
                        }
                      }}
                    >
                      <Box
                        component="input"
                        type="radio"
                        name="resume-delivery-method"
                        value={option.value}
                        checked={checked}
                        onChange={() => setDeliveryMethod(option.value)}
                        sx={{ accentColor: "primary.main" }}
                      />
                      <Box
                        component="span"
                        className="SelectionGroup-label"
                        sx={{ ml: 1.5 }}
                      >
                        {option.label}
                      </Box>
                    </SelectionGroup>
                  );
                })}
              </Box>
            </FormControl>

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
      </Box>
    </Stack>
  );
}
