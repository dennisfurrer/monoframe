import baseConfig from "@monoframe/eslint-config/base";
import nextjsConfig from "@monoframe/eslint-config/nextjs";
import reactConfig from "@monoframe/eslint-config/react";

export default [...baseConfig, ...reactConfig, ...nextjsConfig];
