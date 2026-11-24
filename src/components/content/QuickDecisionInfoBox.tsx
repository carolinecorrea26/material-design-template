import { useEffect, useId, useRef, useState } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import controlPresentation from '../../../requirements/global/presentation-tokens.json';
import QuickDecisionIcon from "../coverage/QuickDecisionIcon";
import { useComponentContent } from './ComponentContentContext';
import QuickDecisionDrawerContent, {
  InlineDrawerLink,
  QuickDecisionMark,
} from "./QuickDecisionExplainer";

/**
 * Reusable QuickDecision info panel shown on the Coverage page,
 * landing page coverage options section, and app menu coverage drawer.
 */
const noticeAttention = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  20% { transform: scale(1.18) rotate(-8deg); }
  40% { transform: scale(1.18) rotate(8deg); }
  60% { transform: scale(1.1) rotate(-5deg); }
  80% { transform: scale(1.05) rotate(3deg); }
`;

export default function QuickDecisionInfoBox({ animateOnReveal = false }: { animateOnReveal?: boolean }) {
  const content = useComponentContent().help.quickDecision;
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const noticeRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  useEffect(() => {
    if (!animateOnReveal || reducedMotion || !noticeRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(noticeRef.current);
    return () => observer.disconnect();
  }, [animateOnReveal, reducedMotion]);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <Box
      ref={noticeRef}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: (t) => alpha(t.palette.success.main, 0.08),
      }}
    >
      <Box component="span" aria-hidden="true" data-notice-attention={revealed && !reducedMotion ? 'revealed' : undefined} sx={{ mt: 0.25, flexShrink: 0, lineHeight: 0,
        animation: revealed && !reducedMotion ? `${noticeAttention} ${controlPresentation.controls.attentionDurationMs}ms ease-in-out` : 'none',
      }}><QuickDecisionIcon color="success" /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          <Typography
            component="span"
            variant="body2"
            sx={{ fontWeight: 700, color: "success.main" }}
          >
            <QuickDecisionMark />
          </Typography>{" "}
          {content.availability}{" "}
          <InlineDrawerLink
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={toggleExpanded}
          >
            {expanded ? content.showLess : content.showMore}
          </InlineDrawerLink>
        </Typography>

        {expanded && (
          <Box id={contentId} sx={{ mt: 1.5 }}>
            <QuickDecisionDrawerContent plainMark />
          </Box>
        )}
      </Box>
    </Box>
  );
}
