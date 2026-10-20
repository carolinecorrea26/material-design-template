import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { readLibraryCatalog, type LibraryCatalog } from "../../../services/libraryCatalogService";
const Context = createContext<LibraryCatalog | null>(null);
export function useLibraryCatalog() {
  const catalog = useContext(Context);
  if (!catalog) throw new Error("Stored Library catalog is required");
  return catalog;
}
export function LibraryCatalogProvider({ siteKey, children }: { siteKey: string; children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const [result, setResult] = useState<{ siteKey: string; generation: number; catalog?: LibraryCatalog; error?: string } | null>(null);
  useEffect(() => {
    let active = true;
    readLibraryCatalog(siteKey).then(catalog => { if (active) setResult({ siteKey, generation, catalog }); }).catch(error => { if (active) setResult({ siteKey, generation, error: error instanceof Error ? error.message : String(error) }); });
    return () => { active = false; };
  }, [siteKey, generation]);
  if (result?.siteKey !== siteKey || result.generation !== generation) return <Typography>Loading Library…</Typography>;
  if (!result.catalog) return <Alert severity="error">Library records could not be loaded: {result.error}<Button onClick={() => setGeneration(value => value + 1)}>Retry</Button></Alert>;
  return <Context.Provider value={result.catalog}><Stack spacing={2}><Button size="small" sx={{ alignSelf: "flex-end" }} onClick={() => setGeneration(value => value + 1)}>Refresh</Button>{children}</Stack></Context.Provider>;
}
