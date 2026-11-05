import { Alert, Typography } from "@mui/material";
import { ComponentContentContext } from "../../src/components/content/ComponentContentContext";
import { FieldDefinitionsContext } from "../../src/components/forms/FieldDefinitionsContext";
import { ClientIconContext } from "../../src/components/content/ClientIconContext";
import { useEffect, useState, type ReactNode } from 'react';
import { readSharedCatalog } from '../../src/persistence/sharedCatalog';
import { buildGlobalTemplate, type TemplateCapability } from '../../src/dev/storybook/globalTemplate';
import type { PrototypeLibrary } from '../../src/domain/prototypeLibrary';

/** Detached authored data for examples. Never installs a Site or reads applicant answers. */
export default function ComponentFixture({ capability = 'standard', children }: {
  capability?: TemplateCapability; children: (fixture: PrototypeLibrary) => ReactNode;
}) {
  const [fixture, setFixture] = useState<PrototypeLibrary>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    readSharedCatalog().then(catalog => { if (!cancelled) setFixture(buildGlobalTemplate(catalog, capability)); }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load example definitions"); });
    return () => { cancelled = true; };
  }, [capability]);
  if (error) return <Alert severity="error">{error}</Alert>;
  return fixture ? <ComponentContentContext value={fixture.content}><FieldDefinitionsContext value={fixture.fields}><ClientIconContext value={fixture.client.branding}>{children(fixture)}</ClientIconContext></FieldDefinitionsContext></ComponentContentContext> : <Typography role="status">Loading example definitions…</Typography>;
}
