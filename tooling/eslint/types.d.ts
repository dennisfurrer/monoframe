declare module "@eslint/js" {
  import type { Linter } from "eslint";
  export const configs: {
    recommended: Linter.Config;
    all: Linter.Config;
  };
}

declare module "eslint-plugin-import" {
  import type { ESLint } from "eslint";
  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module "eslint-plugin-turbo" {
  import type { ESLint, Linter } from "eslint";
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
    };
  };
  export default plugin;
}

declare module "eslint-plugin-react" {
  import type { ESLint, Linter } from "eslint";
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
      "jsx-runtime": Linter.Config;
    };
  };
  export default plugin;
}

declare module "eslint-plugin-react-hooks" {
  import type { ESLint, Linter } from "eslint";
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
    };
  };
  export default plugin;
}

declare module "@next/eslint-plugin-next" {
  import type { ESLint, Linter } from "eslint";
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config;
      "core-web-vitals": Linter.Config;
    };
  };
  export default plugin;
}
