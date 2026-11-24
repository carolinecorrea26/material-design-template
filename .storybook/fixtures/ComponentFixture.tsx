import { Alert, Typography } from "@mui/material";
import { ComponentContentContext } from "../../src/components/content/ComponentContentContext";
import { FieldDefinitionsContext } from "../../src/components/forms/FieldDefinitionsContext";
import { ClientIconContext } from "../../src/components/content/ClientIconContext";
import { useEffect, useState, type ReactNode } from 'react';
import { readSharedCatalog } from '../../src/persistence/sharedCatalog';
import { buildGlobalTemplate, type TemplateCapability, type MembershipExampleConfiguration, type EligibilityExampleConfiguration, type CoverageExampleConfiguration, type HomeExampleConfiguration } from '../../src/dev/storybook/globalTemplate';
import type { PrototypeLibrary } from '../../src/domain/prototypeLibrary';

/** Detached authored data for examples. Never installs a Site or reads applicant answers. */
export default function ComponentFixture({ capability = 'standard', membership, eligibility, coverage, home, children }: {
  capability?: TemplateCapability; membership?: MembershipExampleConfiguration; eligibility?: EligibilityExampleConfiguration; coverage?: CoverageExampleConfiguration; home?: HomeExampleConfiguration; children: (fixture: PrototypeLibrary) => ReactNode;
}) {
  const [fixture, setFixture] = useState<PrototypeLibrary>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    readSharedCatalog().then(catalog => { if (!cancelled) setFixture(buildGlobalTemplate(catalog, capability, membership, eligibility, coverage, undefined, undefined, undefined, undefined, undefined, undefined, home)); }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load example definitions"); });
    return () => { cancelled = true; };
  }, [capability, membership, eligibility, coverage, home]);
  if (error) return <Alert severity="error">{error}</Alert>;
  return fixture ? <ComponentContentContext value={fixture.content}><FieldDefinitionsContext value={fixture.fields}><ClientIconContext value={fixture.client.branding}>{children(fixture)}</ClientIconContext></FieldDefinitionsContext></ComponentContentContext> : <Typography role="status">Loading example definitions…</Typography>;
}
