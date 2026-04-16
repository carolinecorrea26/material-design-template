import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { RouterProvider } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { ApplicationFormProvider } from "../state/ApplicationFormContext";
import theme from "./theme";
import { router } from "./router";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApplicationFormProvider>
          <AppShell>
            <RouterProvider router={router} />
          </AppShell>
        </ApplicationFormProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
