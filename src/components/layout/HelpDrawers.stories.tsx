import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import AppMenu from './AppMenu';
import { getActiveClient } from '../../config/client/getActiveClient';
import HealthInformationHelp from '../health/HealthInformationHelp';
import RecoveryAlert from '../feedback/RecoveryAlert';
import HowApplyingWorksPanel from '../home/HowApplyingWorksPanel';
import { openOverlay } from '../../../.storybook/previewInteractions';
import { getContent } from '../../content';

const meta = { title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Help and application tools',
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Real help/tool owners opened through their application controls. Each dialog is visible when the story finishes preparing; no copied dialog markup or fabricated fields.' } } },
} satisfies Meta;
export default meta;
function MenuExample() {
  const [open, setOpen] = useState(true);
  return <AppMenu open={open} onClose={() => setOpen(false)} client={getActiveClient()} />;
}
export const HowApplyingWorks: StoryObj = { render: () => <MenuExample />, play: openOverlay(/how.*applying.*works/i) };
export const AboutCoverage: StoryObj = { render: () => <MenuExample />, play: openOverlay(/about.*coverage|coverage options/i) };
export const CoverageNeeds: StoryObj = { render: () => <MenuExample />, play: openOverlay('Needs Calculator') };
export const AboutQuickDecision: StoryObj = { render: () => <MenuExample />, play: openOverlay(/about.*quickdecision/i) };
export const HealthInformation: StoryObj = { render: () => <HealthInformationHelp />, play: openOverlay(/how is my health information used/i) };
export const ApplicationReview: StoryObj = { render: () => <HowApplyingWorksPanel variant="drawer" />, play: async context => openOverlay(getContent().home.reviewProcessLinkLabel)(context) };
export const RecoverySupport: StoryObj = { render: () => <RecoveryAlert incident={{ code: 'SAVE_FAILED', operation: 'save', outcome: 'failed', reference: 'REQ-EXAMPLE' }} />, play: openOverlay(/get help/i) };
