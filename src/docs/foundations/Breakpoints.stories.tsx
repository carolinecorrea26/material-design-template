import type { Meta, StoryObj } from '@storybook/react-vite';
import { BreakpointsAndResponsiveDesign as Example } from './Breakpoints';

const meta = { title: 'Foundations/Responsive layout', component: Example, parameters: { layout: 'padded' } } satisfies Meta<typeof Example>;
export default meta;
export const Breakpoints: StoryObj<typeof meta> = {};
