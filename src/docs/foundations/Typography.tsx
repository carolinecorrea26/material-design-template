import type { ReactNode } from 'react';
import { Card, CardContent, Stack, Typography as MuiTypography } from '@mui/material';
import { docsFontFamily } from '../shared/DocsBlocks';
import PageTitle from '../../components/layout/PageTitle';
import CategoryHeader from '../../components/layout/CategoryHeader';
import { ApplicantSectionLabel } from '../../components/layout/ApplicantSectionDivider';
import SectionDivider from '../../components/layout/SectionDivider';
import ProductCard from '../../components/layout/ProductCard';
import EstimatedRate from '../../components/coverage/EstimatedRate';

const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const supporting = [
  { variant: 'subtitle1', label: 'subtitle1 · Introduction', sample: 'Provide the best way for us to reach you.' },
  { variant: 'subtitle2', label: 'subtitle2 · Short heading', sample: 'Coverage details' },
  { variant: 'caption', label: 'caption · Small label', sample: 'Est. cost' },
  { variant: 'overline', label: 'overline · Eyebrow', sample: 'Application information' },
  { variant: 'button', label: 'button · Action label', sample: 'Continue' },
] as const;

function Label({ children }: { children: ReactNode }) {
  return <MuiTypography variant="body2" color="text.secondary" sx={{ fontFamily: docsFontFamily }}>{children}</MuiTypography>;
}

function Example({ label, children }: { label: string; children: ReactNode }) {
  return <Stack spacing={1}>
    <Label>{label}</Label>
    <Card elevation={2}><CardContent>{children}</CardContent></Card>
  </Stack>;
}

export function Typography({ group = 'headings' }: { group?: 'headings' | 'body' | 'application' }) {
  return <Stack spacing={3} sx={{ maxWidth: 880, width: '100%' }}>
    {group === 'headings' && <Card elevation={2}><CardContent><Stack spacing={3}>
      {headings.map(variant => <Stack key={variant} spacing={0.5}>
        <Label>{variant}</Label>
        <MuiTypography variant={variant} component="div">Your insurance application</MuiTypography>
      </Stack>)}
    </Stack></CardContent></Card>}
    {group === 'body' && <>
      <Card elevation={2}><CardContent><Stack spacing={2}>
        <Stack spacing={0.5}><Label>body1 · Paragraph</Label><MuiTypography>Review your information before continuing to the next step.</MuiTypography></Stack>
        <Stack spacing={0.5}><Label>body2 · Supporting copy</Label><MuiTypography variant="body2">Your most recent unsaved changes may not be available.</MuiTypography></Stack>
      </Stack></CardContent></Card>
      <Card elevation={2}><CardContent><Stack spacing={2}>
        {supporting.map(({ variant, label, sample }) => <Stack key={variant} spacing={0.5}>
          <Label>{label}</Label><MuiTypography variant={variant} component="div">{sample}</MuiTypography>
        </Stack>)}
      </Stack></CardContent></Card>
    </>}
    {group === 'application' && <>
      <Example label="Page title and introduction"><PageTitle title="Your preferred contact" subhead="Provide the best way for us to reach you about your application." /></Example>
      <Example label="Category heading"><CategoryHeader label="Life insurance" /></Example>
      <Example label="Applicant label"><ApplicantSectionLabel label="Member information" /></Example>
      <Example label="Subsection title"><SectionDivider label="Business information" variant="subsection" /></Example>
      <Example label="Product heading"><ProductCard productName="Group Term Life" description="Coverage for eligible association members." /></Example>
      <Example label="Estimated cost"><EstimatedRate amount={26.5} suffix="/mo" label="Est. cost" /></Example>
    </>}
  </Stack>;
}
