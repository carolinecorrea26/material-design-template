import { describe, expect, it } from "vitest";
import { getMaxAggregateNotes } from "./coverageConstants";

describe("Site-keyed coverage constants", () => {
  it("applies aggregate-note overrides by Site ID", () => {
    expect(getMaxAggregateNotes("LI", "avma-default")?.child).toContain(
      "one parent",
    );
    expect(getMaxAggregateNotes("LI", "waepa-standard")?.member).toBe(
      "The maximum available for a member is $2,000,000.",
    );
    expect(getMaxAggregateNotes("LI", "waepa-gi")?.member).not.toBe(
      "The maximum available for a member is $2,000,000.",
    );
  });
});
