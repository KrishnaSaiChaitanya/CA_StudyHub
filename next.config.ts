import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist": "pdfjs-dist/legacy/build/pdf.mjs",
    };
    if (dev && !isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
