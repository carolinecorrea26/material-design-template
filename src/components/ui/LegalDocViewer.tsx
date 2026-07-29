import { Divider, List, ListItem, Stack, Typography } from "@mui/material";
import type { LegalDocContent, LegalDocSection } from "../../content/types";

type LegalDocViewerProps = {
  doc: LegalDocContent;
};

function renderSection(section: LegalDocSection, index: number) {
  switch (section.type) {
    case "heading":
      return (
        <Typography
          key={index}
          variant={section.level === 1 ? "h5" : "h6"}
          sx={{ mt: section.level === 1 ? 0 : 2, mb: 1, fontWeight: 700 }}
        >
          {section.text}
        </Typography>
      );
    case "paragraph":
      return (
        <Typography key={index} variant="body2" color="text.secondary">
          {section.text}
        </Typography>
      );
    case "list":
      return (
        <List
          key={index}
          dense
          disablePadding
          sx={{ pl: 2, listStyleType: "disc" }}
        >
          {section.items.map((item, i) => (
            <ListItem
              key={i}
              disableGutters
              sx={{ display: "list-item", pl: 0 }}
            >
              <Typography variant="body2" color="text.secondary">
                {item}
              </Typography>
            </ListItem>
          ))}
        </List>
      );
    case "address":
      return (
        <Typography
          key={index}
          component="address"
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "normal" }}
        >
          {section.lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < section.lines.length - 1 && <br />}
            </span>
          ))}
        </Typography>
      );
    case "note":
      return (
        <Typography
          key={index}
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {section.text}
        </Typography>
      );
    default:
      return null;
  }
}

export default function LegalDocViewer({ doc }: LegalDocViewerProps) {
  return (
    <Stack spacing={2}>
      {doc.sections.map((section, index) => renderSection(section, index))}
      {doc.revision && (
        <>
          <Divider />
          <Typography variant="caption" color="text.secondary">
            Revision: {doc.revision}
          </Typography>
        </>
      )}
    </Stack>
  );
}
