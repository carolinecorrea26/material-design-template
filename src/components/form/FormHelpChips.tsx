import * as React from "react";
import { Box, Chip, Stack, useMediaQuery, useTheme } from "@mui/material";

export type HelpChipItem = {
  id: string;
  label: string;
};

type FormHelpChipsProps = {
  items: HelpChipItem[];
  onSelect: (id: string) => void;
  maxWidth?: number | string;
};

export default function FormHelpChips({
  items,
  onSelect,
  maxWidth = "80ch",
}: FormHelpChipsProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  const updateOverflow = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHasOverflow(el.scrollWidth > el.clientWidth + 1);
  }, []);

  React.useEffect(() => {
    updateOverflow();
    const el = scrollRef.current;
    if (!el) return undefined;

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateOverflow);
      resizeObserver.observe(el);
    }

    window.addEventListener("resize", updateOverflow);
    return () => {
      window.removeEventListener("resize", updateOverflow);
      resizeObserver?.disconnect();
    };
  }, [updateOverflow]);

  const showFade = !isDesktop && hasOverflow;

  if (!items.length) return null;

  return (
    <Stack spacing={2} sx={{ maxWidth }}>
      <Box
        sx={{
          position: "relative",
          ...(showFade
            ? {
                "&::before, &::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 24,
                  pointerEvents: "none",
                  zIndex: 1,
                },
                "&::before": {
                  left: 0,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
                },
                "&::after": {
                  right: 0,
                  background:
                    "linear-gradient(270deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
                },
              }
            : {}),
        }}
      >
        <Stack
          ref={scrollRef}
          spacing={1}
          direction="row"
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            flexWrap: "nowrap",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {items.map((item) => (
            <Chip
              key={item.id}
              // variant="filled"
              variant="outlined"
              color="primary"
              clickable
              onClick={() => onSelect(item.id)}
              label={item.label}
              // sx={{
              //   justifyContent: "flex-start",
              //   width: "fit-content",
              //   border: "1px solid #d8dbe2",
              //   borderRadius: 2,
              //   "& .MuiChip-label": {
              //     whiteSpace: "nowrap",
              //   },
              // }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
