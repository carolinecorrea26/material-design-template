import type { Meta, StoryObj } from '@storybook/react-vite';
import { Colors as Example } from './Colors';

const meta = { title: 'Foundations/Colors', component: Example, parameters: { layout: 'padded' } } satisfies Meta<typeof Example>;
export default meta;
export const Palette: StoryObj<typeof meta> = { name: 'Global palette' };
