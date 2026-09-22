import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Box, Tab, Tabs } from "@mui/material";

export type SectionTabDefinition = {
  id: string;
  label: string;
  /** Additional anchors rendered inside this tab. Used to open the correct tab for deep links. */
  anchorIds?: string[];
};

function currentHash(): string {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

export default function SectionTabs({
  tabs,
  defaultTabId,
  children,
}: {
  tabs: SectionTabDefinition[];
  defaultTabId?: string;
  children: ReactNode;
}) {
  const initialTabId = useMemo(() => {
    const hash = currentHash();
    const matched = tabs.find((tab) => tab.id === hash || tab.anchorIds?.includes(hash));
    return matched?.id ?? defaultTabId ?? tabs[0]?.id ?? "";
  }, [defaultTabId, tabs]);

  const [activeTabId, setActiveTabId] = useState(initialTabId);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = currentHash();
      if (!hash) return;
      const matched = tabs.find((tab) => tab.id === hash || tab.anchorIds?.includes(hash));
      if (matched) setActiveTabId(matched.id);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs]);

  const childArray = Children.toArray(children);
  const activeContent = childArray.find(
    (child): child is ReactElement<{ id?: string }> =>
      isValidElement<{ id?: string }>(child) && child.props.id === activeTabId,
  );

  useEffect(() => {
    const hash = currentHash();
    if (!hash) return;
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab || (activeTab.id !== hash && !activeTab.anchorIds?.includes(hash))) return;

    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    });
  }, [activeTabId, tabs]);

  if (tabs.length === 0) return null;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Tabs
        value={activeTabId}
        onChange={(_, value: string) => setActiveTabId(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>
      {activeContent}
    </Box>
  );
}
