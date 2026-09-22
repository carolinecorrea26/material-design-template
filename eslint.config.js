// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([globalIgnores(['dist', 'storybook-static']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  rules: {
    // This prototype intentionally colocates provider hooks/config helpers with
    // their components, and its config/content modules export JSX helpers.
    'react-refresh/only-export-components': 'off',
    // React Hook Form exposes dynamic, schema-driven values whose public types
    // legitimately cross heterogeneous field shapes throughout this prototype.
    '@typescript-eslint/no-explicit-any': 'off',
    // These compiler-oriented rules flag established synchronization patterns
    // (route resets, externally-driven MUI state) that are behaviorally tested.
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/incompatible-library': 'off',
  },
}, ...storybook.configs["flat/recommended"]])
