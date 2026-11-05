import { Typography } from "@mui/material";

/** Text and native blocks share the actual Consent boundary, so source notes
 * retain their placement without HTML injection or duplicate consent copy. */
export default function ReviewStatement({ text, notices }: { text: string; notices: Array<{ key: string; paragraphs: string[]; emphasis?: "bold" }> }) {
  const boundary = text.lastIndexOf("\n\nCONSENT:");
  const style = { whiteSpace: "pre-wrap", lineHeight: 1.5, display: "block" };
  if (!notices.length || boundary < 0) return <Typography variant="caption" sx={style}>{text}</Typography>;
  return <>
    <Typography variant="caption" sx={style}>{text.slice(0, boundary)}</Typography>
    {notices.map(block => block.paragraphs.map((paragraph, index) => <Typography key={`${block.key}.${index}`} component={block.emphasis === "bold" ? "strong" : "span"} variant="caption" sx={{ ...style, my: 1.5, ...(block.emphasis === "bold" ? { fontWeight: 700 } : {}) }}>{paragraph}</Typography>))}
    <Typography variant="caption" sx={style}>{text.slice(boundary).trimStart()}</Typography>
  </>;
}
