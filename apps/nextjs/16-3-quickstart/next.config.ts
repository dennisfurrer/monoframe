import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: [
    "@monoframe/cache",
    "@monoframe/ui-atoms",
    "@monoframe/ui-molecules",
  ],
};

export default nextConfig;
