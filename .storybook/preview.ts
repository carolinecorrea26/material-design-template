import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { theme } from "../src/theme/muiTheme";

const preview: Preview = {
  decorators: [
    (Story) => (
      React.createElement(MemoryRouter, null,
        React.createElement(ThemeProvider, { theme },
          React.createElement(CssBaseline, null),
          React.createElement(Container, { sx: { py: 3 } },
            React.createElement(Story)
          )
        )
      )
    )
  ]
};

export default preview;
