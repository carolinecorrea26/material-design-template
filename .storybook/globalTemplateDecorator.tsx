import { useLayoutEffect, useState } from 'react';
import type { Decorator } from '@storybook/react-vite';
import type { PrototypeLibrary } from '../src/domain/prototypeLibrary';
import PreviewRuntime from '../src/dev/preview/PreviewRuntime';
import { readSharedCatalog } from '../src/persistence/sharedCatalog';
import { buildGlobalTemplate, type TemplateCapability } from '../src/dev/storybook/globalTemplate';

export function GlobalTemplate({ children, capability }: { children: React.ReactNode; capability: TemplateCapability }) {
  const [fixture, setFixture] = useState<PrototypeLibrary>();
  useLayoutEffect(() => {
    let cancelled = false;
    readSharedCatalog().then(catalog => {
      if (cancelled) return;
      setFixture(buildGlobalTemplate(catalog, capability));
    });
    return () => { cancelled = true; };
  }, [capability]);
  return fixture ? <PreviewRuntime library={fixture}>{children}</PreviewRuntime> : null;
}
const withGlobalTemplate: Decorator = (Story, context) => context.parameters.standalone ? <Story /> : <GlobalTemplate key={context.id} capability={context.parameters.templateCapability ?? 'standard'}><Story /></GlobalTemplate>;
export default withGlobalTemplate;
