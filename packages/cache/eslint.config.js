import baseConfig from "@monoframe/eslint-config/base";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    rules: {
      // This package models plain data, not extendable contracts.
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
];
