import { useState } from 'react';
import { Typography } from '@mui/material';
import FormHelpChips from '../content/HelpChips';
import AppDrawer from '../layout/AppDrawer';
import { helpChipDefinitions } from '../../content/interactionLabels';
import { healthInformationText } from '../../content/healthInformation';

const items = [helpChipDefinitions.health];

/** Shared Health help chip and explanation drawer, including the QD loading page. */
export default function HealthInformationHelp() {
  const [open, setOpen] = useState(false);
  return <>
    <FormHelpChips items={items} onSelect={() => setOpen(true)} />
    <AppDrawer open={open} title={helpChipDefinitions.health.label} onClose={() => setOpen(false)}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{healthInformationText}</Typography>
    </AppDrawer>
  </>;
}
