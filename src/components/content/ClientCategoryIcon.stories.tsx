import type { Meta, StoryObj } from '@storybook/react-vite';
import Diversity1RoundedIcon from '@mui/icons-material/Diversity1Rounded';
import { clientCategoryIcon as CreateCategoryIcon } from './ClientCategoryIcon';
import { ClientIconContext } from './ClientIconContext';
import presentation from '../../../requirements/global/prototype-fixtures/storybook-presentation.json';

const LifeIcon = CreateCategoryIcon('LI', Diversity1RoundedIcon);
const meta = {
  id: 'content-client-category-icon',
  title: 'Components/Content and data display/Category artwork',
  component: LifeIcon,
  parameters: { standalone: true, docs: { description: { component: 'The existing category-icon factory uses configured artwork and falls back to the stock icon if an image cannot load. Stock category choices are already shown in Coverage; these examples cover the two artwork-specific states.' } } },
} satisfies Meta<typeof LifeIcon>;
export default meta;
function Artwork({ source }: { source: string }) {
  return <ClientIconContext.Provider value={{ ...presentation.branding, icons: { categories: { LI: source } } }}><LifeIcon titleAccess="Life coverage" fontSize="large" /></ClientIconContext.Provider>;
}
export const ConfiguredArtwork: StoryObj = { render: () => <Artwork source={presentation.branding.logo} /> };
export const BrokenArtwork: StoryObj = { render: () => <Artwork source="/missing-category-artwork.svg" /> };
