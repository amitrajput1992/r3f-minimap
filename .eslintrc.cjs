module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/triple-slash-reference": "off",
    // note you must disable the base rule as it can report incorrect errors
    "no-unused-vars": "off",
    "quotes": ["error", "double", { "allowTemplateLiterals": true }],
    "@typescript-eslint/no-unused-vars": ["warn", {
      "ignoreRestSiblings": true,
      "argsIgnorePattern": "(^_|^req$|^request$|^res$|^next$|^h|^ctx$)",
    }],
  },
};
