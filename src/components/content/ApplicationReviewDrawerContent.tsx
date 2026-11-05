import { Box, Stack, Typography } from "@mui/material";
import { InlineDrawerLink, QuickDecisionMark } from "./QuickDecisionExplainer";
import { useComponentContent } from "./ComponentContentContext";
export default function ApplicationReviewDrawerContent({
  onOpenQuickDecision,
}: {
  onOpenQuickDecision: () => void;
}) {
  const reviewHelp = useComponentContent().help.applicationReview;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {reviewHelp.intro}
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {reviewHelp.whatToExpectTitle}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {reviewHelp.whatToExpectItems.map((item, i) => (
            <Typography
              key={i}
              component="li"
              variant="body2"
              color="text.secondary"
            >
              {item}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {reviewHelp.closingNote.split("QuickDecision")[0]}
        <InlineDrawerLink onClick={onOpenQuickDecision}>
          <QuickDecisionMark />
        </InlineDrawerLink>
        {reviewHelp.closingNote
          .split("QuickDecision")
          .slice(1)
          .join("QuickDecision")}
      </Typography>
    </Stack>
  );
}

