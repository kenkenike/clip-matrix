import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;