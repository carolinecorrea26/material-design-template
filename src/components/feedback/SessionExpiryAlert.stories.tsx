import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { fn } from 'storybook/test';
import SessionExpiryAlert from './SessionExpiryAlert';

const meta = { id: "feedback-session-expiry-warning",
  title: "Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Session warning", component: SessionExpiryAlert, args: { onKeepActive: fn() }, render: args => <WarningDemo {...args} />, parameters: { layout: 'padded' } } satisfies Meta<typeof SessionExpiryAlert>;
export default meta;
export const TwoMinutes: StoryObj<typeof meta> = { name: 'Two minutes — live countdown', args: { secondsLeft: 120 }, render: args => <WarningDemo {...args} live /> };
export const LastTenSeconds: StoryObj<typeof meta> = { name: 'Last ten seconds — static reference', args: { secondsLeft: 10 } };
function WarningDemo({ secondsLeft, onKeepActive, live = false }: { secondsLeft: number; onKeepActive: () => void; live?: boolean }) {
  const [open, setOpen] = useState(true);
  const [seconds, setSeconds] = useState(secondsLeft);
  useEffect(() => setSeconds(secondsLeft), [secondsLeft]);
  useEffect(() => {
    if (!live || !open) return;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [live, open]);
  return <>
    <Button variant="outlined" onClick={() => { setSeconds(secondsLeft); setOpen(true); }}>Show session warning</Button>
    {open && <SessionExpiryAlert secondsLeft={seconds} onKeepActive={() => { setOpen(false); onKeepActive(); }} />}
  </>;
}
export const LiveCountdown: StoryObj<typeof meta> = { args: { secondsLeft: 120 }, render: args => <WarningDemo {...args} live /> };
