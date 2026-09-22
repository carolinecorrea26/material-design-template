import { useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  InputAdornment,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AppModal from "../layout/AppModal";
import { componentsData } from "../../content/docs/componentInventory";

// storybookLink values are root-relative story paths (e.g. "/?path=/story/...").
// Storybook runs on its own dev server (see package.json's "storybook" script),
// not this app's origin, so links must be made absolute to it or clicking them
// from the running app just reloads the app itself with a dead query string.
const STORYBOOK_BASE_URL = "http://localhost:6006";

function resolveStorybookHref(comp: { hasStory: boolean; storybookLink: string }) {
  return comp.hasStory ? `${STORYBOOK_BASE_URL}${comp.storybookLink}` : null;
}

function ResponsiveTableContainer({ children }: { children: React.ReactNode }) {
  return (
    <TableContainer
      component={Card}
      variant="outlined"
      sx={{
        overflowX: "auto",
        width: "100%",
        "& td, & th": { fontSize: { xs: "0.75rem", md: "0.8125rem" } },
        "& td": { whiteSpace: "normal" },
        "& th": { whiteSpace: "nowrap", fontWeight: 700 },
      }}
    >
      {children}
    </TableContainer>
  );
}

export default function ComponentInventorySection() {
  const [filter, setFilter] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const filteredComponents = useMemo(() => {
    if (!filter) return componentsData;
    const lc = filter.toLowerCase();
    return componentsData.filter((c) =>
      `${c.name} ${c.category} ${c.description} ${c.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [filter]);

  const selectedComponent = useMemo(() => {
    if (!selectedName) return null;
    return componentsData.find((c) => c.name === selectedName) ?? null;
  }, [selectedName]);

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        placeholder="Filter components…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 220, maxWidth: 360 }}
      />
      <ResponsiveTableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Component</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Used in</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Storybook</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComponents.map((comp) => (
              <TableRow key={comp.name}>
                <TableCell>
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ fontWeight: 700, textAlign: "left" }}
                    onClick={() => setSelectedName(comp.name)}
                  >
                    {comp.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip label={comp.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell sx={{ whiteSpace: "normal !important", maxWidth: 300 }}>
                  {comp.description}
                </TableCell>
                <TableCell sx={{ whiteSpace: "normal !important", maxWidth: 200 }}>
                  {comp.usedIn}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {comp.sourcePath}
                  </Typography>
                </TableCell>
                <TableCell>
                  {resolveStorybookHref(comp) ? (
                    <Link href={resolveStorybookHref(comp)!} target="_blank" rel="noopener">
                      Story
                    </Link>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No story yet
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableContainer>

      <AppModal
        open={!!selectedName}
        onClose={() => setSelectedName(null)}
        title={selectedName ?? ""}
        maxWidth={560}
        minHeight="auto"
      >
        {selectedComponent ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Typography>{selectedComponent.category}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography>{selectedComponent.description}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Used in
              </Typography>
              <Typography>{selectedComponent.usedIn}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">{selectedComponent.sourcePath}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Storybook
              </Typography>
              {resolveStorybookHref(selectedComponent) ? (
                <Link
                  href={resolveStorybookHref(selectedComponent)!}
                  target="_blank"
                  rel="noopener"
                >
                  {resolveStorybookHref(selectedComponent)}
                </Link>
              ) : (
                <Typography color="text.secondary">
                  No story yet — see the component source for now.
                </Typography>
              )}
            </Box>
          </Stack>
        ) : (
          <Typography color="text.secondary">Component not found.</Typography>
        )}
      </AppModal>
    </Stack>
  );
}
