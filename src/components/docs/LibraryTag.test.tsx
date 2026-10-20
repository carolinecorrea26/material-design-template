import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryTag, { libraryTagColors } from "./LibraryTag";

describe("Library tag presentation", () => {
  it("uses the same colors only for matching normalized labels", () => {
    expect(libraryTagColors("Inherited")).toEqual(libraryTagColors("inherited"));
    expect(libraryTagColors("Inherited")).not.toEqual(libraryTagColors("Modified"));
  });
  it("uses theme error colors for missing required details", () => {
    expect(libraryTagColors("Details needed")).toEqual({ backgroundColor: "error.main", color: "error.contrastText" });
  });
  it("renders small filled, noninteractive tags even for legacy props", () => {
    const html = renderToStaticMarkup(<LibraryTag label="Inherited" variant="outlined" size="medium" clickable onClick={() => {}} />);
    expect(html).toContain("MuiChip-filled");
    expect(html).toContain("MuiChip-sizeSmall");
    expect(html).not.toContain("MuiChip-clickable");
    expect(html).not.toContain('role="button"');
  });
});
