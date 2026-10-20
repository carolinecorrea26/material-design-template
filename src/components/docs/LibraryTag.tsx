import { Chip, type ChipProps } from "@mui/material";

/** A label has one color everywhere. Tags never navigate or trigger actions. */
export function libraryTagColors(label: string) {
  const key = label.trim().toLowerCase();
  if (key === "details needed") return { backgroundColor: "error.main", color: "error.contrastText" };
  if (["yes", "on", "enabled", "true"].includes(key)) return { backgroundColor: "success.main", color: "success.contrastText" };
  if (["no", "off", "disabled", "false"].includes(key)) return { backgroundColor: "action.selected", color: "text.secondary" };
  let hash = 0;
  for (const char of key) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const hue = (hash % 36000) / 100;
  return { backgroundColor: `hsl(${hue} 65% 90%)`, color: `hsl(${hue} 70% 22%)` };
}
export default function LibraryTag({ label, ...props }: ChipProps) {
  return <Chip {...props} label={label} size="small" variant="filled" clickable={false} onClick={undefined} onDelete={undefined} sx={{ ...libraryTagColors(String(label)), height: 24, maxWidth: "100%", fontWeight: 500, border: 0 }} />;
}
