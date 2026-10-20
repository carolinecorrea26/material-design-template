import { createContext, useContext } from "react";
import type { PageId } from "../types";

export type SinglePageFlow = {
  pageId: PageId;
  goToSection: (pageId: PageId, scrollTarget?: PageId) => void;
  completeSection: (pageId: PageId, nextPageId: PageId) => void;
  navigationPending: boolean;
  setNavigationPending: (pending: boolean) => void;
};

export const SinglePageFlowContext = createContext<SinglePageFlow | null>(null);
export const useSinglePageFlow = () => useContext(SinglePageFlowContext);
