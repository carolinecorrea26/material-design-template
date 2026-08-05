import { useEffect, useState } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";

export type DocsSidebarItem = { id: string; label: string };

type DocsSidebarNavProps = {
  title?: string;
  items: DocsSidebarItem[];
};

/**
 * Sticky left-hand chapter navigation for internal documentation pages
 * (Information Architecture, Design System). Highlights the section
 * currently in view, similar to docs sites like mui.com.
 *
 * Hidden below the `md` breakpoint — mobile falls back to the page's own
 * horizontal chip-based table of contents.
 */
export default function DocsSidebarNav({
  title = "Contents",
  items,
}: DocsSidebarNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [items]);

  return (
    <Box
      component="nav"
      aria-label={title}
      sx={{
        position: "sticky",
        top: 24,
        alignSelf: "flex-start",
        width: 220,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
        maxHeight: "calc(100vh - 48px)",
        overflowY: "auto",
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mb: 1, pl: 2 }}
      >
        {title}
      </Typography>
      <Stack
        component="ul"
        spacing={0.25}
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          borderLeft: "2px solid",
          borderColor: "divider",
        }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Box component="li" key={item.id}>
              <Link
                href={`#${item.id}`}
                underline="none"
                sx={{
                  display: "block",
                  py: 0.5,
                  pl: 2,
                  ml: "-2px",
                  borderLeft: "2px solid",
                  borderColor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "primary.main" : "text.secondary",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.8125rem",
                  transition: "color 120ms ease, border-color 120ms ease",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {item.label}
              </Link>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
