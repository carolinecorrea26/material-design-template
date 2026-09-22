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
