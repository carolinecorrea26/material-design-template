import { Box, Stack, Typography, Button } from '@mui/material';
import RHFTextField from './RHFTextField';
import RHFRadioGroup from './RHFRadioGroup';
import DateField from './DateField';
import { GENDER_OPTIONS, YES_NO_OPTIONS } from '../../constants/formOptions';
import { commonStyles } from '../../theme/commonStyles';

interface ChildInformationCardProps {
  index: number;
  onRemove: () => void;
  showRemove: boolean;
}

export default function ChildInformationCard({ index, onRemove, showRemove }: ChildInformationCardProps) {
  return (
    <Box sx={commonStyles.borderedBox}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={commonStyles.fontWeightBold}>
            Child {index + 1}
          </Typography>
          {showRemove && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RHFTextField
            name={`children.${index}.firstName`}
            label="First Name"
            required
          />
          <RHFTextField
            name={`children.${index}.lastName`}
            label="Last Name"
            required
          />
        </Stack>

        <DateField
          name={`children.${index}.birthday`}
          label="Birthday"
          required
        />
        
        <RHFRadioGroup
          name={`children.${index}.gender`}
          label="Gender"
          options={GENDER_OPTIONS}
          required
        />
        
        <RHFRadioGroup
          name={`children.${index}.militaryDischarge`}
          label="Has this child been honorably discharged from active or reserve services in the Armed Forces?"
          options={YES_NO_OPTIONS}
          required
        />
      </Stack>
    </Box>
  );
}
