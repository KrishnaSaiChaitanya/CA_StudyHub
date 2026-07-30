const nextVitalsConfig = require("eslint-config-next/core-web-vitals");
const nextTypeScriptConfig = require("eslint-config-next/typescript");

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextVitalsConfig,
  ...nextTypeScriptConfig,
  {
    rules: {
      // Warn on unused vars; ignore underscore-prefixed names
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Warn on accidental `any` usage
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty object types (common in Shadcn/Radix patterns)
      "@typescript-eslint/no-empty-object-type": "off",
      // Keep exhaustive-deps as a warning for now
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

module.exports = eslintConfig;

