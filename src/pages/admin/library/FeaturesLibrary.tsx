import { libraryRepository } from "../../../repositories/libraryRepository";
import { Children, isValidElement, type ReactNode } from "react";
import { Typography } from "@mui/material";

import BrowseTable from "../../../components/docs/BrowseTable";

const featuresData = libraryRepository.read("featuresData");

// Keep rich descriptions/links when rendering, with their text available to search and sort.
function searchableText(node: ReactNode): string {
  return Children.toArray(node).map((child): string => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{ children?: ReactNode }>(child) ? searchableText(child.props.children) : "";
  }).join(" ");
}

export default function FeaturesLibrary() {
  return <BrowseTable label="Features" rows={featuresData} rowKey={(row) => row.id} columns={[
    { id: "name", label: "Feature", width: 260, value: (row) => `${row.name} ${row.id}`, render: (row) => <><Typography variant="body2" fontWeight={700}>{row.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{row.id}</Typography></> },
    { id: "description", label: "Description", width: 420, value: (row) => searchableText(row.description), render: (row) => row.description },
    { id: "areas", label: "Impacted areas", width: 360, value: (row) => searchableText(row.impactedAreas), render: (row) => row.impactedAreas },
  ]} />;
}

