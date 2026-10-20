import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClientIconContext } from "./ClientIconContext";
import QuickDecisionIcon from "./QuickDecisionIcon";
import { coverageCategories } from "../../config/coverageCategories";
import { getEffectiveSiteConfig } from "../../data";
function markup(site:string) {
 return renderToStaticMarkup(<ClientIconContext value={getEffectiveSiteConfig(site).branding}><QuickDecisionIcon/>{coverageCategories.map(category=><category.icon key={category.id}/>)}</ClientIconContext>);
}
describe("client icon overrides",()=>{
 it.each(["waepa","waepa-gi"])("%s inherits QD, life and disability artwork",site=>{
  const html=markup(site);
  for(const asset of ["quick-decision","life","disability"]) expect(html).toContain(`/client/waepa/icons/${asset}.svg`);
  expect(html).toContain('data-testid="BusinessOutlinedIcon"');
 });
 it("other clients retain the standard icons",()=>{
  const html=markup("demo");
  expect(html).not.toContain('/client/waepa/icons/');
  expect(html).toContain('data-testid="OfflineBoltIcon"');
  expect(html).toContain('data-testid="Diversity1RoundedIcon"');
 });
});
