/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "detect" } },
  env: { browser: true, es2022: true, node: true },
  plugins: ["react", "react-hooks", "jsx-a11y", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  }
};
