import type { Meta, StoryObj } from '@storybook/react-vite';
import { MuiThemeOverrides as Example } from './ThemeOverrides';

const meta = { id: "foundations-component-theme-overrides",
  title: "Foundations/Overrides", component: Example, parameters: { standalone: true, layout: 'padded' } } satisfies Meta<typeof Example>;
export default meta;
export const Overrides: StoryObj<typeof meta> = {};
