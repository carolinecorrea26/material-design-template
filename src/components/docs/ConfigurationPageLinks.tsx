import { Stack } from "@mui/material";
import Chip from "./LibraryTag";
import LibraryLink from "../../pages/admin/library/LibraryLink";
import { libraryRepository } from "../../repositories/libraryRepository";
import { getSiteDetailsPageLabel } from "../../config/resolvers/resolveClientPages";
import type { ConfigurationPage } from "../../content/docs/configurations";

export default function ConfigurationPageLinks({ page }: { page: ConfigurationPage }) {
  const pages = libraryRepository.read("pages");
  if (page.id === "global") return <Chip label="Global" />;
  return <Stack spacing={0.5} alignItems="flex-start">{(page.pageIds ?? [page.id]).map(id => {
    const record = pages.find(record => record.id === id);
    return record ? <LibraryLink key={id} domain="pages" filters={{ q: record.id }}>{getSiteDetailsPageLabel(record.id)}</LibraryLink> : <Chip key={id} label={page.label} />;
  })}</Stack>;
}
