import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Project photos are downscaled in the browser first; Vercel caps request bodies at ~4.5MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
