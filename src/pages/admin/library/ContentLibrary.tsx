import { Stack, Tab, Tabs } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { libraryHref } from "./LibraryLink";
import StoredLibraryDomain from "./StoredLibraryDomain";
import CommunicationsLibrary from "./CommunicationsLibrary";

export default function ContentLibrary({ siteKey, domain }: { siteKey: string; domain?: string }) {
  const [search] = useSearchParams();
  const selected = search.get("view") === "emails" || search.get("view") !== "cms" && (domain === "communications" || domain === "emails") ? "emails" : "cms";
  return <Stack spacing={2}>
    <Tabs value={selected} aria-label="Content views">
      <Tab value="cms" label="CMS" component={RouterLink} to={libraryHref('content', search, { view: 'cms' })} /><Tab value="emails" label="Emails" component={RouterLink} to={libraryHref('content', search, { view: 'emails' })} />
    </Tabs>
    {selected === "emails" ? <CommunicationsLibrary siteKey={siteKey} /> : <StoredLibraryDomain domain="content" siteKey={siteKey} />}
  </Stack>;
}
