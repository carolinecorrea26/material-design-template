import { useState, type ReactNode } from 'react';
import AppShell, { type AppShellVariant } from '../src/components/layout/AppShell';
import { ApplicationFormContext, type ApplicationFormValues } from '../src/app/ApplicationFormContext';
import { recoveryTemplate } from '../src/content/applicationRecovery';

/** Use the real shared header/body/footer with local fictional form state. */
export default function RecoveryPageExample({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<ApplicationFormValues>({});
  return <ApplicationFormContext.Provider value={{ values, setPageValues: patch => setValues(current => ({ ...current, ...patch })), resetValues: () => setValues({}) }}>
    <AppShell variant={recoveryTemplate.header as AppShellVariant}>{children}</AppShell>
  </ApplicationFormContext.Provider>;
}
