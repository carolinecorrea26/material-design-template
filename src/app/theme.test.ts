import { describe, expect, it } from "vitest";
import { createAppTheme } from "./theme";
import type { ThemeColorId } from "../config/clients/types";

const presetPrimaryColors: Record<
  ThemeColorId,
  { main: string; light: string; dark: string }
> = {
  default: { main: "#0668ff", light: "#5c94ff", dark: "#034cba" },
  teal: { main: "#0882a1", light: "#39a4bf", dark: "#005b70" },
  purple: { main: "#3f51b5", light: "#7986cb", dark: "#283593" },
  "dark-blue": { main: "#045aab", light: "#316493", dark: "#002f5b" },
};

describe("createAppTheme", () => {
  it("applies a custom full palette and inherits omitted colors", () => {
    const theme = createAppTheme({type:"custom",primary:"#001F5F",palette:{background:{default:"#ffffff",paper:"#fafafa"},success:{main:"#228822"},error:{main:"#bb2222"},text:{primary:"#111111"},support:{main:"#eeeeff",border:"#aaaaee"}}});
    expect(theme.palette.background.default).toBe("#ffffff");
    expect(theme.palette.success.main).toBe("#228822");
    expect(theme.palette.error.main).toBe("#bb2222");
    expect(theme.palette.text.primary).toBe("#111111");
    expect(theme.typography.body1.color).toBe("#111111");
    expect(theme.palette.background.surface).toBeTruthy();
    expect(theme.palette.support.main).toBe("#eeeeff");
  });
  it.each(Object.entries(presetPrimaryColors))(
    "preserves the %s preset palette",
    (preset, expected) => {
      const theme = createAppTheme({
        type: "preset",
        preset: preset as ThemeColorId,
      });

      expect(theme.palette.primary).toMatchObject(expected);
    },
  );

  it("derives a complete primary palette from one custom color", () => {
    const theme = createAppTheme({ type: "custom", primary: "#6750a4" });

    expect(theme.palette.primary.main).toBe("#6750a4");
    expect(theme.palette.primary.light).not.toBe("#6750a4");
    expect(theme.palette.primary.dark).not.toBe("#6750a4");
    expect(theme.palette.primary.contrastText).toBeTruthy();
    expect(theme.palette.error.main).toBe("#ed0a0a");
    expect(theme.palette.success.main).toBe("#009465");
  });

  it("rejects an invalid custom color at runtime", () => {
    expect(() =>
      createAppTheme({ type: "custom", primary: "#not-a-color" }),
    ).toThrow("Invalid custom theme primary color");
  });
});
