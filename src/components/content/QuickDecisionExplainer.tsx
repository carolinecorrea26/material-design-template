import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { getContent } from "../../content";

function InlineDrawerLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Typography
      component="span"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "inline",
        color: "primary.main",
        font: "inherit",
        lineHeight: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "0.12em",
        cursor: "pointer",
      }}
    >
      {children}
    </Typography>
  );
}

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

/** Inline styled QuickDecision mark with bold, success green, and lightning icon. */
function QuickDecisionMarkStyled() {
  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 700,
        color: "success.main",
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.25,
      }}
    >
      <OfflineBoltIcon
        color="success"
        sx={{ fontSize: "1em", alignSelf: "center" }}
      />
      <QuickDecisionMark />
    </Typography>
  );
}

/** Inline QuickDecision mark with bold weight only, no color or icon. */
function QuickDecisionMarkPlain() {
  return (
    <Typography component="span" variant="inherit" sx={{ fontWeight: 700 }}>
      <QuickDecisionMark />
    </Typography>
  );
}

export {
  InlineDrawerLink,
  QuickDecisionMark,
  QuickDecisionMarkStyled,
  QuickDecisionMarkPlain,
};

export default function QuickDecisionDrawerContent({
  plainMark = false,
}: {
  plainMark?: boolean;
}) {
  const content = getContent().help.quickDecision;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {plainMark ? <QuickDecisionMarkPlain /> : <QuickDecisionMarkStyled />}{" "}
        {content.intro}
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {content.whatToExpectTitle}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {content.whatToExpectItems.map((item, i) => (
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

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {content.importantToKnowTitle}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            {content.importantToKnowItems[0]}
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <QuickDecisionMark /> {content.importantToKnowItems[1]}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
