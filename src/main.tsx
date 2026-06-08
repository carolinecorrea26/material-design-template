import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { getTestFlowMode } from "./config/testFlow";

// Persist testFlow URL param to sessionStorage immediately on app load,
// before any navigation can strip it from the URL.
getTestFlowMode();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
