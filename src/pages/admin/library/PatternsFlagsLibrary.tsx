import { libraryRepository } from "../../../repositories/libraryRepository";
import { Alert, Stack } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";

import { libraryMetadata } from "../../../domain/provenance";

const flagCatalog = libraryRepository.read("flagCatalog");
const patternCatalog = libraryRepository.read("patternCatalog");

const patterns = patternCatalog.map(p => ({ ...p, ...libraryMetadata("patterns", p.key, `canonical:seedPatterns/${p.key}`) }));
const flags = flagCatalog.map(f => ({ ...f, ...libraryMetadata("flagDefinitions", f.key, `canonical:seedFlags/${f.key}`) }));

export default function PatternsFlagsLibrary({ kind }: { kind: "patterns" | "flags" }) {
  return <Stack spacing={2}>
    <Alert severity="info">Canonical definitions for review. Site assignments and derived values are not active yet.</Alert>
    {kind === "patterns" ? <BrowseTable label="Patterns" rows={patterns} rowKey={r => r.key} columns={[
      { id: "displayId", label: "ID #", value: r => String(r.displayId) },
      { id: "key", label: "Key", value: r => r.key },
      { id: "name", label: "Name", value: r => r.name, width: 260 },
      { id: "category", label: "Category", value: r => r.category, filter: true, tag: true },
      { id: "description", label: "Description", value: r => r.summary, width: 360 },
      { id: "providedBy", label: "Provided by", value: r => r.providedBy ?? "" },
      { id: "source", label: "Source", value: r => r.sourceReference ?? "", width: 260 },
    ]} /> : <BrowseTable label="Flags" rows={flags} rowKey={r => r.key} columns={[
      { id: "displayId", label: "ID #", value: r => String(r.displayId) },
      { id: "key", label: "Key", value: r => r.key, width: 250 },
      { id: "name", label: "Name", value: r => r.name, width: 240 },
      { id: "scope", label: "Scope", value: r => r.level, filter: true, tag: true },
      { id: "persistence", label: "Value source", value: r => r.persistence, filter: true, tag: true },
      { id: "values", label: "Allowed values", value: r => "allowedValues" in r ? r.allowedValues.join(", ") : "true / false" },
      { id: "providedBy", label: "Provided by", value: r => r.providedBy ?? "" },
      { id: "source", label: "Source", value: r => r.sourceReference ?? "", width: 260 },
    ]} />}
  </Stack>;
}

