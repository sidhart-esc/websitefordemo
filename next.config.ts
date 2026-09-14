import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/websitefordemo",
  assetPrefix: "/websitefordemo/",
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;