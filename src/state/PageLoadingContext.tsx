import * as React from "react";

interface PageLoadingProviderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

const PageLoadingContext = React.createContext<boolean | undefined>(undefined);

export function PageLoadingProvider({
  isLoading,
  children,
}: PageLoadingProviderProps) {
  return (
    <PageLoadingContext.Provider value={isLoading}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = React.useContext(PageLoadingContext);
  return {
    isPageLoading: context ?? false,
  };
}
