import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Typography } from '@mui/material';
import type { FormRouteRenderProps } from '../../src/app/RoutePage';
import type { FieldDefinition } from '../../src/config/fields/types';
import type { PageSectionConfig } from '../../src/config/pageSections/types';

/** Local form state only. Fields and sections are explicit example inputs. */
export default function SectionStoryForm({ initialValues = {}, fields, sections = [], children }: {
  initialValues?: Record<string, any>;
  fields: FieldDefinition[];
  sections?: PageSectionConfig[];
  children: (props: FormRouteRenderProps) => ReactNode;
}) {
  const form = useForm({ defaultValues: initialValues, mode: 'onBlur' });
  const [validated, setValidated] = useState(false);
  return <Box component="form" noValidate onSubmit={form.handleSubmit(() => setValidated(true), () => setValidated(false))}
    sx={{ width: '100%', maxWidth: 640, mx: 'auto', p: { xs: 2, sm: 4 } }}>
    {children({ control: form.control, errors: form.formState.errors, watchedValues: form.watch(), setValue: form.setValue, trigger: form.trigger, allFields: fields, pageSections: sections })}
    <Button type="submit" variant="outlined" sx={{ mt: 3 }}>Check required fields</Button>
    <Typography role="status" variant="body2">{validated ? 'Required fields are complete.' : ''}</Typography>
  </Box>;
}
