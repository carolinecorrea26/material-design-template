import { Stack } from '@mui/material';
import RHFTextField from './RHFTextField';
import RHFSelect from './RHFSelect';

interface PersonalInfoFieldsProps {
  prefix: string; // e.g., "" for self, "spouse" for spouse
  titleOptions: { label: string; value: string | number }[];
}

export default function PersonalInfoFields({ prefix, titleOptions }: PersonalInfoFieldsProps) {
  const getName = (field: string) => prefix ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field;

  return (
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={2} 
      sx={{ 
        '& .MuiFormControl-root': { width: '100%' },
        '& > :nth-of-type(1)': { width: { md: '150px' } },  // Title
        '& > :nth-of-type(2)': { flex: { md: 1 } },         // First Name
        '& > :nth-of-type(3)': { width: { md: '60px' } },   // MI
        '& > :nth-of-type(4)': { flex: { md: 1 } },         // Last Name
        '& > :nth-of-type(5)': { width: { md: '100px' } },  // Suffix
      }}
    >
      <RHFSelect
        name={getName('title')}
        label="Title"
        options={titleOptions}
      />
      <RHFTextField
        name={getName('firstName')}
        label="First Name"
        required
      />
      <RHFTextField
        name={getName('middleInitial')}
        label="MI"
        inputProps={{ maxLength: 1 }}
      />
      <RHFTextField
        name={getName('lastName')}
        label="Last Name"
        required
      />
      <RHFTextField
        name={getName('suffix')}
        label="Suffix"
      />
    </Stack>
  );
}
