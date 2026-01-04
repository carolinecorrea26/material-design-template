import * as React from "react";
import { Stack, Typography, Box, Alert } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { CollapsibleSection } from "../components/common";
import { Person, People } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export default function Decision() {
  const navigate = useNavigate();
  const { data } = useAppData();

  const handleContinue = () => {
    navigate("/receipt");
  };

  // Mock decisions - in a real app, this would come from API
  const yourDecisions = [
    {
      product: "Traditional Term Life Insurance",
      decision: "Your coverage request has been conditionally approved and has been securely sent to the administrator. You will be sent details of your coverage once the request is confirmed."
    },
    {
      product: "10-Year Level Term Life Insurance",
      decision: "Some products require additional medical information before we can provide a decision about your request. A representative from New York Life or ExamOne, our medical service provider, will contact you for your health information and to schedule any appointments. To learn more about how medical underwriting works, you can download our Underwriting Guide."
    }
  ];

  const spouseDecisions = [
    {
      product: "Traditional Term Life Insurance",
      decision: "Your spouse's coverage request has been conditionally approved and has been securely sent to the administrator. Your spouse will be sent details of their coverage once the request is confirmed."
    }
  ];

  const hasSpouse = data.eligibility?.applicants?.spouse;

  return (
    <Stack spacing={4}>
      <PageHeader 
        title="Decision"
        notes="We have already started work on the next steps for your requested coverage. Here is the status and what to expect next."
      />

      {/* Your Insurance Decision */}
      <CollapsibleSection
        title="Your Insurance Decision"
        icon={<Person color="primary" />}
      >
        <Stack spacing={3}>
          {yourDecisions.map((item, index) => (
            <Box key={index}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {item.product}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.decision}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CollapsibleSection>

      {/* Spouse Insurance Decision - only show if spouse applied */}
      {hasSpouse && (
        <CollapsibleSection
          title="Spouse Insurance Decision"
          icon={<People color="primary" />}
        >
          <Stack spacing={3}>
            {spouseDecisions.map((item, index) => (
              <Box key={index}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {item.product}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.decision}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CollapsibleSection>
      )}

      <PageNavigation 
        backPath="/docusign"
        onContinue={handleContinue}
        continueText="Next"
      />
    </Stack>
  );
}
