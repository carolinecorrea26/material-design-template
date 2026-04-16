import { getAvailableClientPageGroups } from "../client/getAvailableClientPageGroups";
import { getAvailableClientPages } from "../client/getAvailableClientPages";

export default function Home() {
  const availablePages = getAvailableClientPages();
  const availablePageGroups = getAvailableClientPageGroups();

  return (
    <div>
      <div>Home</div>

      <div>Available Pages</div>
      <div>
        {availablePages.map((page) => (
          <div key={page.id}>
            {page.id} - {page.title}
          </div>
        ))}
      </div>

      <div>Available Page Groups</div>
      <div>
        {availablePageGroups.map((group) => (
          <div key={group.id}>
            {group.id}
          </div>
        ))}
      </div>
    </div>
  );
}
