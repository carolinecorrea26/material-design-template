import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { ThemeProvider } from '@mui/material';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createAppTheme } from '../../app/theme';
import { resolveMappedFields } from '../../domain/requirementFields';
import FieldRenderer from '../forms/FieldRenderer';
import ControlledFieldRenderer from '../forms/ControlledFieldRenderer';
import ConditionalGroup from '../forms/ConditionalGroup';
import FieldGrid from './FieldGrid';
import { FieldGroup } from './SectionDivider';

const fields = resolveMappedFields({ component: 'eligibility' }).filter(field => ['zip-postal-code', 'state-province', 'birth-date'].includes(field.id));
let root: Root, host: HTMLDivElement;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
function Fields({ controlled, error }: { controlled: boolean; error: boolean }) {
  const form = useForm<Record<string, string | boolean | string[]>>();
  return fields.map(field => controlled
    ? <ControlledFieldRenderer key={field.id} field={field} value="" onChange={() => {}} error={error ? 'Check this answer' : undefined} />
    : <FieldRenderer key={field.id} field={field} control={form.control} errors={error ? { [field.id]: { type: 'validate', message: 'Check this answer' } } : {}} />);
}
const layouts = {
  grid: (children: ReactNode) => <FieldGrid>{children}</FieldGrid>,
  group: (children: ReactNode) => <FieldGroup>{children}</FieldGroup>,
  conditional: (children: ReactNode) => <ConditionalGroup>{children}</ConditionalGroup>,
};
it.each(Object.entries(layouts))('gives controlled and application fields the same layout-owned spacing in %s, including feedback', async (_name, layout) => {
  for (const controlled of [true, false]) for (const error of [false, true]) {
    await act(async () => root.render(<ThemeProvider theme={createAppTheme()}>{layout(<Fields controlled={controlled} error={error} />)}</ThemeProvider>));
    const wrappers = [...host.querySelectorAll<HTMLElement>('.FieldRenderer-root')];
    expect(wrappers).toHaveLength(3);
    for (const wrapper of wrappers) {
      expect(getComputedStyle(wrapper).display).toBe('block');
      expect(getComputedStyle(wrapper.parentElement!).rowGap).toBe('24px');
      expect(Number.parseFloat(getComputedStyle(wrapper.parentElement!).marginTop) || 0).toBe(0);
    }
    expect(host.querySelector('.MuiFormControl-marginNormal')).toBeNull();
    for (const helper of host.querySelectorAll('.MuiFormHelperText-root')) expect(getComputedStyle(helper).marginBottom).toBe('0px');
    expect(host.textContent?.includes('Check this answer')).toBe(error);
  }
});
