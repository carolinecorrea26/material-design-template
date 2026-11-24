import { useInterfaceText } from '../content/useInterfaceText';
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { IconButton } from "@mui/material";

export default function StepEditButton({ label, disabled, onClick }: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const text = useInterfaceText();
  return (
    <IconButton
      className="StepEditButton-root"
      aria-label={text('edit-step', { label })}
      disabled={disabled}
      onClick={onClick}
    >
      <EditRoundedIcon fontSize="inherit" />
    </IconButton>
  );
}
