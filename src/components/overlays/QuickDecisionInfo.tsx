import { Box, Stack, Typography } from "@mui/material";

function QuickDecisionMark() {
  return (
    <>
      QuickDecision
      <Box component="sup" sx={{ fontSize: "0.6em", lineHeight: 1 }}>
        SM
      </Box>
    </>
  );
}

export { QuickDecisionMark };

export default function QuickDecisionDrawerContent() {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        <QuickDecisionMark /> helps speed up your application by using your
        answers to health questions along with securely accessed data, such as
        prescription history, medical claims, driving records, and prior
        insurance activity. In many cases, this means no medical exams or lab
        tests are needed.
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          What to expect
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Most decisions are made quickly.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Some applications may need additional review.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            If so, an underwriter may contact you for more information.
          </Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Important to know
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Approval depends on confirming your group status and eligibility for
            the coverage amount selected.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <QuickDecisionMark /> may not be available for all products or in
            all states/territories.
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
