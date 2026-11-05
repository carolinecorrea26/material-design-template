import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Link, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { createAppTheme } from '../../app/theme';
import { readSharedCatalog } from '../../persistence/sharedCatalog';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';

const meta = {
  id: "forms-button",
  title: "Components/Actions/Buttons",
  component: Button,
  parameters: { standalone: true, layout: 'centered' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
    <Button variant="contained">Primary action</Button>
    <Button variant="outlined">Secondary action</Button>
    <Button variant="text">Text action</Button>
  </Stack>,
};
export const ColorOverride: Story = {
  name: 'Theme color and button override',
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  render: (_args, context) => {
    const catalog = context.loaded.catalog as Awaited<ReturnType<typeof readSharedCatalog>>;
    const waepa = resolvePrototypeLibrary(catalog.data, 'waepa', catalog.revision).client;
    return <Stack spacing={4}>
      {[{ name: 'Default — theme color', theme: createAppTheme() }, { name: 'WAEPA — button color override', theme: createAppTheme(waepa.theme) }].map(example =>
        <ThemeProvider key={example.name} theme={example.theme}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{example.name}</Typography>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
              <Button variant="contained">Continue</Button>
              <Button variant="outlined">Back</Button>
              <Link href="#" onClick={event => event.preventDefault()}>View details</Link>
            </Stack>
          </Stack>
        </ThemeProvider>)}
    </Stack>;
  },
};
export const States: Story = {
  render: () => <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
    <Button variant="contained" disabled>Disabled</Button>
    <Button variant="contained" loading>Saving</Button>
    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Continue</Button>
  </Stack>,
};
export const Sizes: Story = {
  render: () => <Stack direction="row" spacing={2} alignItems="center">
    <Button variant="contained" size="small">Small</Button>
    <Button variant="contained" size="medium">Medium</Button>
    <Button variant="contained" size="large">Large</Button>
  </Stack>,
};

export const Corners: Story = {
  render: () => <Stack spacing={3}>
    <Stack spacing={1}>
      <Typography variant="body2">Rounded / pill</Typography>
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
        <Button variant="contained" sx={{ borderRadius: '9999px' }}>Contained</Button>
        <Button variant="outlined" sx={{ borderRadius: '9999px' }}>Outlined</Button>
      </Stack>
    </Stack>
    <Stack spacing={1}>
      <Typography variant="body2">Square / standard</Typography>
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
        <Button variant="contained" sx={{ borderRadius: 1 }}>Contained</Button>
        <Button variant="outlined" sx={{ borderRadius: 1 }}>Outlined</Button>
      </Stack>
    </Stack>
  </Stack>,
};
