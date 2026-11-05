import { useForm } from 'react-hook-form';
import { Box, Typography } from '@mui/material';
import DynamicList from '../src/components/forms/DynamicList';
import { disabilityCompanyMapping } from '../src/config/fields/profileListFields';
const sampleCompanies = [
  { company: "Example Carrier", monthlyBenefitAmount: "$1,200", benefitPeriod: "Age 65", waitingPeriod: "90 days" },
  { company: "Other Example Carrier", monthlyBenefitAmount: "$800", benefitPeriod: "5 years", waitingPeriod: "60 days" },
];

function renderCompany(item: Record<string, string>) {
  return <>
    <Typography variant="subtitle2">{item.company || "Company"}</Typography>
    <Typography variant="caption" color="text.secondary">
      {`${item.monthlyBenefitAmount || "$0"} | ${item.benefitPeriod || "Benefit period not provided"} | ${item.waitingPeriod || "Waiting period not provided"}`}
    </Typography>
  </>;
}

export default function CompanyRecordExample({ populated = false, maxItems = 10, legacyOrdering = false }) {
  const { control } = useForm<Record<string, unknown>>({
    defaultValues: { selfDisabilityCompanies: populated ? sampleCompanies : [] },
  });
  return <Box sx={{ maxWidth: 480 }}>
    <DynamicList
      control={control}
      name="selfDisabilityCompanies"
      label="Company"
      mapping={legacyOrdering ? { ...disabilityCompanyMapping, gridFields: disabilityCompanyMapping.fields.slice(0, 2).map(field => field.id) } : disabilityCompanyMapping}
      renderItem={renderCompany}
      getItemLabel={item => item.company}
      maxItems={maxItems}
    />
  </Box>;
}

