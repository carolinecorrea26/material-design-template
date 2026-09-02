// src/app/App.tsx

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { RouterProvider } from "react-router-dom";
import { ApplicationFormProvider } from "./ApplicationFormContext";
import { ReviewSubmittedProvider } from "./useReviewSubmitted";
import { createAppTheme } from "./theme";
import { router } from "./router";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getActiveClient } from "../config/client/getActiveClient";
import { getFormTemplate } from "../config/template/resolveTemplate";

const client = getActiveClient();
const template = getFormTemplate();
const theme = createAppTheme(client.themeColor, {
  forceMobileLayout: template === "single",
});

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApplicationFormProvider>
          <ReviewSubmittedProvider>
            <RouterProvider router={router} />
          </ReviewSubmittedProvider>
        </ApplicationFormProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
