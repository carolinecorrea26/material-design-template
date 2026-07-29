import { Switch } from "@mui/material";
import { styled } from "@mui/material/styles";

/**
 * Custom styled toggle switch for monthly/annual rate frequency display.
 * Used in cost summary panels and quote comparison views.
 */
const RateFrequencyToggle = styled(Switch)(({ theme }) => ({
  width: 48,
  height: 26,
  padding: 5,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(4px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M7 2v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H9V2H7Zm12 18H5V10h14v10Z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.primary.main,
    width: 24,
    height: 24,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11Z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    borderRadius: 13,
    backgroundColor: "#cdd9ec",
  },
}));

export default RateFrequencyToggle;
