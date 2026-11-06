import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EstimatedRate from "./EstimatedRate";

describe("estimated rates", () => {
  it("does not classify missing or invalid prices as technical failures", () => {
    for (const amount of [NaN, Infinity, -Infinity]) {
      const output = renderToStaticMarkup(<EstimatedRate amount={amount} suffix="/mo" sx={{ color: "error.main", fontSize: "2rem" }} />);
      expect(output).toBe("");
      expect(output).not.toContain("Estimate unavailable");
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

it('shows unavailable only for an explicit technical failure', () => {
  const output = renderToStaticMarkup(<EstimatedRate display={{ status: 'unavailable', reason: 'technical' }} suffix="/mo" />);
  expect(output).toContain('Estimate unavailable');
  expect(output).not.toContain('/mo');
});
it('renders configured alternatives without an unavailable warning or empty price label', () => {
  expect(renderToStaticMarkup(<EstimatedRate display={{ status: 'hidden' }} label="Est. cost:" />)).toBe('');
  const separate = renderToStaticMarkup(<EstimatedRate display={{ status: 'provided-separately' }} />);
  expect(separate).toContain('Rate provided separately');
  expect(separate).not.toContain('Estimate unavailable');
  const reference = renderToStaticMarkup(<EstimatedRate display={{ status: 'reference-table', table: { version: 1, kind: 'html-table', title: 'Rates', columns: ['Rate'], rows: [['$10']] } }} label="Est. cost:" />);
  expect(reference).toContain('View rate table');
  expect(reference).not.toContain('Est. cost:');
});

it('keeps an initial rate request in loading even before any amount has returned', () => {
  const output = renderToStaticMarkup(<EstimatedRate amount={NaN} isCalculating />);
  expect(output).toContain('Recalculating estimated cost');
  expect(output).not.toContain('Estimate unavailable');
  expect(output).not.toContain('Complete the required information');
});
