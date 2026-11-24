import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/components/!(admin|docs)/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/app/RoutePage.stories.tsx",
    "../src/docs/ReusableComponents.stories.tsx",
    "../src/docs/foundations/*.stories.tsx"
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
  "staticDirs": ["../public"],
  // Storybook owns this copy; Vite copying public/ concurrently can race it.
  viteFinal: async config => ({ ...config, publicDir: false })
};
export default config;
