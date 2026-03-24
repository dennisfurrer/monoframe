import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monoframe/ui-atoms", "@monoframe/ui-molecules"],
};

export default nextConfig;
