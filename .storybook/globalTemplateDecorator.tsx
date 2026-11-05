import { ComponentContentContext } from "../src/components/content/ComponentContentContext";
import { FieldDefinitionsContext } from "../src/components/forms/FieldDefinitionsContext";
import { ClientIconContext } from "../src/components/content/ClientIconContext";
import { useLayoutEffect, useState } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { getPrototypeLibrary, installPrototypeLibrary } from '../src/domain/prototypeLibrary';
import { readSharedCatalog } from '../src/persistence/sharedCatalog';
import { buildGlobalTemplate, type TemplateCapability } from '../src/dev/storybook/globalTemplate';

export function GlobalTemplate({ children, capability }: { children: React.ReactNode; capability: TemplateCapability }) {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    let cancelled = false;
    const previous = getPrototypeLibrary();
    readSharedCatalog().then(catalog => {
      if (cancelled) return;
      installPrototypeLibrary(buildGlobalTemplate(catalog, capability));
      setReady(true);
    });
    return () => { cancelled = true; installPrototypeLibrary(previous); };
  }, [capability]);
  const fixture = getPrototypeLibrary();
  return ready && fixture ? <ComponentContentContext value={fixture.content}><FieldDefinitionsContext value={fixture.fields}><ClientIconContext value={fixture.client.branding}>{children}</ClientIconContext></FieldDefinitionsContext></ComponentContentContext> : null;
}
const withGlobalTemplate: Decorator = (Story, context) => context.parameters.standalone ? <Story /> : <GlobalTemplate key={context.id} capability={context.parameters.templateCapability ?? 'standard'}><Story /></GlobalTemplate>;
export default withGlobalTemplate;
