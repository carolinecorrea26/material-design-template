import { Stack, Typography } from "@mui/material";
import { errorMessages, errorMessagePageOrder } from "../../content/docs/errorMessages";
import BrowseTable from "./BrowseTable";

export default function ValidationReferenceList({ includedPageIds, level }: { includedPageIds?: ReadonlySet<string>; level?: "Page" | "Field" }) {
  const labels = Object.fromEntries(errorMessagePageOrder.map((page) => [page.key, page.label]));
  return <Stack spacing={3}>
    {(["Page", "Field"] as const).filter((entry) => !level || entry === level).map((entry) => {
      const rows = errorMessages.map((row, index) => ({ ...row, key: `${index}` })).filter((row) => row.level === entry && (!includedPageIds || row.page === "global" || includedPageIds.has(row.page)));
      const title = `${entry} validation`;
      return <Stack key={entry} spacing={1.5}>
        <Typography component="h2" variant="h6">{title}</Typography>
        <BrowseTable acceptUrlFilters={false} label={title} rows={rows} rowKey={(row) => row.key} columns={[
          { id: "page", label: "Page", width: 180, value: (row) => labels[row.page] ?? row.page, filter: true },
          { id: "trigger", label: "Trigger", width: 360, value: (row) => row.trigger },
          { id: "message", label: "Message", width: 360, value: (row) => row.message },
        ]} />
      </Stack>;
    })}
  </Stack>;
}
