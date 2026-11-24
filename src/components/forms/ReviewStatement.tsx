import { Fragment, type ReactNode } from "react";
import { Typography } from "@mui/material";

/** Text and native blocks share the actual Consent boundary, so source notes
 * retain their placement without HTML injection or duplicate consent copy. */
export default function ReviewStatement<T extends { key: string; paragraphs: string[]; emphasis?: "bold" }>({ text, notices, renderNotice, renderText = value => value }: { text: string; notices: T[]; renderNotice?: (notice: T) => ReactNode; renderText?: (text: string) => ReactNode }) {
  const boundary = text.startsWith("CONSENT:") ? 0 : text.lastIndexOf("\n\nCONSENT:");
  const style = { whiteSpace: "pre-wrap", lineHeight: 1.5, display: "block" };
  if (!notices.length || boundary < 0) return <Typography variant="caption" sx={style}>{renderText(text)}</Typography>;
  return <>
    {boundary > 0 && <Typography variant="caption" sx={style}>{renderText(text.slice(0, boundary))}</Typography>}
    {notices.map(block => renderNotice ? <Fragment key={block.key}>{renderNotice(block)}</Fragment> : block.paragraphs.map((paragraph, index) => <Typography key={`${block.key}.${index}`} component={block.emphasis === "bold" ? "strong" : "span"} variant="caption" sx={{ ...style, my: 1.5, ...(block.emphasis === "bold" ? { fontWeight: 700 } : {}) }}>{renderText(paragraph)}</Typography>))}
    <Typography variant="caption" sx={style}>{renderText(text.slice(boundary).trimStart())}</Typography>
  </>;
}
