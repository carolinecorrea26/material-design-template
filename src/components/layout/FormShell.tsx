import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

export default styled(Paper)(({ theme }) => ({
  width: "100%",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(3) },
}));
