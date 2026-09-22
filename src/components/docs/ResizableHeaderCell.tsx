import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { Box, TableCell } from "@mui/material";

export default function ResizableHeaderCell({
  width,
  onResize,
  children,
  sx,
}: {
  width: number;
  onResize: (nextWidth: number) => void;
  children: ReactNode;
  sx?: object;
}) {
  const handleMouseDown = (event: ReactMouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      onResize(Math.max(60, startWidth + (moveEvent.clientX - startX)));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <TableCell
      sx={{
        width,
        minWidth: width,
        maxWidth: width,
        position: "relative",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {children}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          top: 0,
          right: -3,
          height: "100%",
          width: "6px",
          cursor: "col-resize",
          zIndex: 1,
          "&:hover": { bgcolor: "divider" },
        }}
      />
    </TableCell>
  );
}
