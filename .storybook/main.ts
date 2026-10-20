import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/components/!(admin|docs)/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/app/RoutePage.stories.tsx",
    "../src/pages/admin/Accounts.stories.tsx"
  ],
  "addons": [
    "@storybook/addon-a11y"
  ],
  "framework": "@storybook/react-vite",
  "docs": {
    "defaultName": "Docs"
  },
  // Serves the app's real public/ assets (client logos, hero images) so
  // Component examples can reference actual files instead of placeholders.
  "staticDirs": ["../public"]
};
export default config;