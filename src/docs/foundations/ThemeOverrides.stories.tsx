import type { Meta, StoryObj } from '@storybook/react-vite';
import { MuiThemeOverrides as Example } from './ThemeOverrides';

const meta = { id: "foundations-component-theme-overrides",
  title: "Reference/Theme configuration", component: Example, parameters: { layout: 'padded' } } satisfies Meta<typeof Example>;
export default meta;
export const Overrides: StoryObj<typeof meta> = {};
