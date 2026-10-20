import { createContext, useContext } from "react";
export type LibraryScope = "global" | "effective";
export const LibraryScopeContext = createContext<LibraryScope>("global");
export const useLibraryScope = () => useContext(LibraryScopeContext);
