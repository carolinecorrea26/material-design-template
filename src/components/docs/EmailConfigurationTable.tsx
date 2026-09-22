import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ClientId } from "../../types";
import { clients } from "../../config/clients";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import ResponsiveTableContainer from "./ResponsiveTableContainer";

const GLOBAL_CONFIGURATION_ROWS = [
  {
    id: "hideContactBox",
    label: "Hide contact box",
    description: 'Hide the "Questions?" box completely.',
    defaultValue: "Show",
  },
  {
    id: "supportOverride",
    label: "Support override",
    description:
      'Allows a client to override the client-configured phone, email, and website shown in the "Questions?" box.',
    defaultValue: "Use client support configuration",
  },
  {
    id: "contactOverride",
    label: "Contact override",
    description:
      'Allows a client to override the client-configured name and acronym used for the contact shown in the "Questions?" box.',
    defaultValue: "Use client name / acronym",
  },
] as const;

function formatObject(value: Record<string, string | undefined> | undefined): string {
  if (!value) return "—";
  const parts = Object.entries(value)
    .filter(([, item]) => Boolean(item))
    .map(([key, item]) => `${key}: ${item}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function GlobalEmailConfigurationTable() {
  return (
    <ResponsiveTableContainer>
      <Table size="small" aria-label="Global email configuration options">
        <TableHead>
          <TableRow>
            <TableCell>Configuration</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Global default</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {GLOBAL_CONFIGURATION_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell sx={{ verticalAlign: "top", fontWeight: 700 }}>{row.label}</TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                {row.description}
              </TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                {row.defaultValue}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableContainer>
  );
}

export function ClientEmailConfigurationTable({ clientId }: { clientId: ClientId }) {
  const client = clients[clientId];
  const hideContactBox = Boolean(client.emailSupport?.hideContactBox);
  const supportOverride = client.emailSupport?.supportOverride;
  const contactOverride = client.emailSupport?.contactOverride;

  const rows = [
    {
      id: "hideContactBox",
      label: "Hide contact box",
      globalValue: "Show",
      overrideValue: hideContactBox ? "Hide" : "—",
      effectiveValue: hideContactBox ? "Hide" : "Show",
      overridden: hideContactBox,
    },
    {
      id: "supportOverride",
      label: "Support override",
      globalValue: "Use client support configuration",
      overrideValue: formatObject(supportOverride),
      effectiveValue: supportOverride
        ? formatObject({
            phone: supportOverride.phone ?? client.support.phoneDisplay ?? client.support.phone,
            email: supportOverride.email ?? client.support.email,
            website: supportOverride.website ?? client.support.website,
          })
        : formatObject({
            phone: client.support.phoneDisplay ?? client.support.phone,
            email: client.support.email,
            website: client.support.website,
          }),
      overridden: Boolean(supportOverride),
    },
    {
      id: "contactOverride",
      label: "Contact override",
      globalValue: "Use client name / acronym",
      overrideValue: formatObject(contactOverride),
      effectiveValue: formatObject({
        name: contactOverride?.name ?? client.branding.name,
        acronym: contactOverride?.acronym ?? client.branding.acronym,
      }),
      overridden: Boolean(contactOverride),
    },
  ];

  return (
    <ResponsiveTableContainer>
      <Table size="small" aria-label={`Email configuration for ${client.branding.name}`}>
        <TableHead>
          <TableRow>
            <TableCell>Configuration</TableCell>
            <TableCell>Global</TableCell>
            <TableCell>Client override</TableCell>
            <TableCell>Effective</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={row.overridden ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
              <TableCell sx={{ verticalAlign: "top", fontWeight: 700 }}>{row.label}</TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", color: "text.secondary" }}>
                {row.globalValue}
              </TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                {row.overridden ? row.overrideValue : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                    Inherited
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", fontWeight: row.overridden ? 700 : 400 }}>
                {row.effectiveValue}
              </TableCell>
              <TableCell sx={{ verticalAlign: "top" }}>
                <Chip
                  label={row.overridden ? "Overridden" : "Inherited"}
                  size="small"
                  variant={row.overridden ? "filled" : "outlined"}
                  sx={row.overridden ? {
                    bgcolor: CLIENT_HIGHLIGHT_BG,
                    borderColor: CLIENT_HIGHLIGHT_BORDER,
                    color: "#5c4a00",
                    border: "1px solid",
                    fontWeight: 600,
                  } : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableContainer>
  );
}
