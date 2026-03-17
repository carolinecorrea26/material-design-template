import * as React from "react";

type LayoutMode = "multi-page";

interface LayoutContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

const LayoutContext = React.createContext<LayoutContextType | undefined>(
  undefined,
);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>("multi-page");

  const handleSetLayoutMode = React.useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
  }, []);

  return (
    <LayoutContext.Provider
      value={{ layoutMode, setLayoutMode: handleSetLayoutMode }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
}
