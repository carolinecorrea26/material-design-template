import { beforeEach, describe, expect, it } from "vitest";
import { applicationSessionStorage } from "./applicationSessionStorage";

describe("applicationSessionStorage", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("persists and clears transient application flags behind one adapter", () => {
    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: false,
      advisorApplicantFlow: false,
    });

    applicationSessionStorage.writeReviewSubmitted(true);
    applicationSessionStorage.writeAdvisorApplicantFlow(true);

    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: true,
      advisorApplicantFlow: true,
    });

    applicationSessionStorage.clear();
    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: false,
      advisorApplicantFlow: false,
    });
  });
});
