import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-a11y"
  ],
  "framework": "@storybook/react-vite",
  "docs": {
    "defaultName": "Docs"
  },
  // Serves the app's real public/ assets (client logos, hero images) so
  // Foundations/Branding can reference actual files instead of placeholders.
  "staticDirs": ["../public"]
};
export default config;