import baseConfig from "@monoframe/eslint-config/base";
import nextjsConfig from "@monoframe/eslint-config/nextjs";
import reactConfig from "@monoframe/eslint-config/react";

export default [
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  {
    // A "use cache" scope must be async even when its body has no await.
    files: ["src/app/**/page.tsx"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
];
