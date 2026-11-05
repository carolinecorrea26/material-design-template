import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconsGuidelines } from '../../components/docs/IconsGuidelines';

const meta = { title: 'Foundations/Icons', component: IconsGuidelines } satisfies Meta<typeof IconsGuidelines>;
export default meta;
export const Icons: StoryObj<typeof meta> = {};
