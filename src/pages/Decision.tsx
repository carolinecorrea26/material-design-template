import * as React from "react";
import { Stack, Typography, Box, Card, CardContent } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import FormStepTransition from "../components/layout/FormStepTransition";
import { PersonOutline, FavoriteBorder } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { getProducts } from "../api/client";
import type { Product } from "../types/app";
import { getHealthFlow } from "../utils/healthFlow";
import { commonStyles } from "../theme/commonStyles";

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Box
        sx={{
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        {icon}
      </Box>
      <Typography sx={commonStyles.sidebarText}>{label}</Typography>
    </Stack>
  );
}

export default function Decision() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products", err);
      });
  }, []);

  const { routes } = React.useMemo(
    () => getHealthFlow(data.coverage, products),
    [data.coverage, products],
  );
  const backPath = routes.length > 0 ? routes[routes.length - 1] : "/docusign";

  const handleContinue = () => {
    navigate("/payment-information");
  };

  // Mock decisions - in a real app, this would come from API
  const yourDecisions = [
    {
      product: "Traditional Term Life Insurance",
      decision:
        "Your coverage request has been conditionally approved and has been securely sent to the administrator. You will be sent details of your coverage once the request is confirmed.",
    },
    {
      product: "10-Year Level Term Life Insurance",
      decision:
        "Some products require additional medical information before we can provide a decision about your request. A representative from New York Life or ExamOne, our medical service provider, will contact you for your health information and to schedule any appointments. To learn more about how medical underwriting works, you can download our Underwriting Guide.",
    },
  ];

  const spouseDecisions = [
    {
      product: "Traditional Term Life Insurance",
      decision:
        "Your spouse's coverage request has been conditionally approved and has been securely sent to the administrator. Your spouse will be sent details of their coverage once the request is confirmed.",
    },
  ];

  const hasSpouse = data.eligibility?.applicants?.spouse;

  return (
    <Stack spacing={4}>
      <PageHeader
        title="Review the decision details for your requested coverage."
        notes="We have already started work on the next steps for your requested coverage. Here is the status and what to expect next."
      />

      <FormStepTransition>
        <Box sx={commonStyles.mutedSectionPanel}>
          <Card variant="outlined" sx={commonStyles.coverageCard}>
            <CardContent>
              <Stack spacing={3}>
                <SectionLabel icon={<PersonOutline />} label="Self" />
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
            </CardContent>
          </Card>

          {/* Spouse Insurance Decision - only show if spouse applied */}
          {hasSpouse && (
            <Card variant="outlined" sx={commonStyles.coverageCard}>
              <CardContent>
                <Stack spacing={3}>
                  <SectionLabel icon={<FavoriteBorder />} label="Spouse" />
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
              </CardContent>
            </Card>
          )}
        </Box>
      </FormStepTransition>

      <PageNavigation
        backPath={backPath}
        onContinue={handleContinue}
        continueText="Next"
      />
    </Stack>
  );
}
