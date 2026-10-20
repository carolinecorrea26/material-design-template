import { Navigate, useSearchParams } from "react-router-dom";
import { clientEntities, getSite, getSitesForClient } from "../data";

/** Keep older bookmarks pointing to the current Library email previews. */
export default function MockEmailPreview() {
  const [search] = useSearchParams();
  const requestedSite = search.get("site");
  const client = clientEntities.find(client => client.id === search.get("client"));
  const site = requestedSite && getSite(requestedSite) ? requestedSite : client ? getSitesForClient(client.id)[0]?.id ?? "all" : "all";
  return <Navigate replace to={`/admin-center/library/communications?site=${encodeURIComponent(site)}`} />;
}
