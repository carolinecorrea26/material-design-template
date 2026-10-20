import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EstimatedRate from "./EstimatedRate";

describe("estimated rates", () => {
  it("shows missing or invalid prices without a currency amount or billing suffix", () => {
    for (const amount of [NaN, Infinity, -Infinity]) {
      const output = renderToStaticMarkup(<EstimatedRate amount={amount} suffix="/mo" sx={{ color: "error.main", fontSize: "2rem" }} />);
      expect(output).toContain("Estimate unavailable");
      expect(output).not.toContain("/mo");
      expect(output).not.toContain("$");
      expect(output).not.toContain("2rem");
    }
  });
  it("keeps a zero estimate distinct from an unavailable estimate", () => {
    const output = renderToStaticMarkup(<EstimatedRate amount={0} suffix="/yr" />);
    expect(output).toContain("$0.00");
    expect(output).toContain("/yr");
    expect(output).not.toContain("Estimate unavailable");
  });
});
