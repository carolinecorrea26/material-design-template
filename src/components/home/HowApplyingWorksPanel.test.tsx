import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Home from "../../pages/Home";
import { ApplicationFormContext } from "../../app/ApplicationFormContext";
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { demoClient } from "../../config/clients/demo";
import type { HomePageVariant } from "../../config/clients/types";
import HowApplyingWorksPanel from "./HowApplyingWorksPanel";
import { homeDefaults } from "../../content/defaults";

function renderHome(variant: HomePageVariant, applyingStepsPresentation?: "static" | "animated") {
  return renderToStaticMarkup(<MemoryRouter><ApplicationSessionContext value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><ApplicationFormContext value={{ values: {}, setPageValues: () => {}, resetValues: () => {} }}><Home previewClient={{ ...demoClient, features: { ...demoClient.features, homePageVariant: variant, applyingStepsPresentation } }} /></ApplicationFormContext></ApplicationSessionContext></MemoryRouter>);
}
describe("homepage applying-steps presentation", () => {
  it.each(["default", "hero-image", "quoteFirst"] as const)("%s renders the three regular illustrations", variant => {
    const html = renderHome(variant);
    for (const image of ["apply", "health", "decision"]) expect(html).toContain(`data-illustration="${image}"`);
  });
  it.each(["default", "quoteFirst"] as const)("%s supports an explicitly configured animated preview", variant => {
    const html = renderHome(variant, "animated");
    expect(html).not.toContain("data-illustration=");
    expect(html).toContain("Choose your coverage");
  });
  it("welcome-back hides the applying-steps section", () => {
    const html = renderHome("welcome-back");
    expect(html).not.toContain("How does applying work?");
    expect(html).not.toContain("data-illustration=");
  });
});

describe("shared illustrated applying steps", () => {
  it.each(["page", "drawer"] as const)("renders the same illustrations and steps in the %s variant", variant => {
    const html = renderToStaticMarkup(<HowApplyingWorksPanel variant={variant} presentation="static" />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const illustrations = [...doc.querySelectorAll('[data-illustration]')];
    expect(illustrations.map(image => image.getAttribute("data-illustration"))).toEqual(["apply", "health", "decision"]);
    illustrations.forEach((image, index) => {
      const step = image.parentElement!;
      expect(step.firstElementChild).toBe(image);
      expect(step.querySelector("h3")?.textContent).toBe(homeDefaults.applyingSteps[index].title);
      expect(step.textContent).toContain(homeDefaults.applyingSteps[index].body);
    });
  });

  it("keeps drawer illustrations when the page uses the animated demonstration", () => {
    const html = renderToStaticMarkup(<HowApplyingWorksPanel variant="drawer" presentation="animated" />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll('[data-illustration]')).toHaveLength(3);
    expect(doc.body.textContent).toContain(homeDefaults.reviewProcessLinkLabel);
    expect(doc.body.textContent).toContain("QuickDecision");
  });
});
