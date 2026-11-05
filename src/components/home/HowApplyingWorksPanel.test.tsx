import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Home from "../../pages/Home";
import { ApplicationFormContext } from "../../app/ApplicationFormContext";
import { demoClient } from "../../config/clients/demo";
import type { HomePageVariant } from "../../config/clients/types";

function renderHome(variant: HomePageVariant, applyingStepsPresentation?: "image" | "animated") {
  return renderToStaticMarkup(<MemoryRouter><ApplicationFormContext value={{ values: {}, setPageValues: () => {}, resetValues: () => {} }}><Home previewClient={{ ...demoClient, features: { ...demoClient.features, homePageVariant: variant, applyingStepsPresentation } }} /></ApplicationFormContext></MemoryRouter>);
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
