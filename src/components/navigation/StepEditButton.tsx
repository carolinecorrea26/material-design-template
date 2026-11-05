import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { IconButton } from "@mui/material";

export default function StepEditButton({ label, disabled, onClick }: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton
      aria-label={`Edit ${label}`}
      disabled={disabled}
      onClick={onClick}
      sx={{
        fontSize: "1.25rem",
        border: "none",
        borderRadius: "50%",
        color: "#001f5f",
        bgcolor: "#e2ebff",
        p: "4px",
        "&:hover": { bgcolor: "#d3e1ff" },
      }}
    >
      <EditRoundedIcon fontSize="inherit" />
    </IconButton>
  );
}
