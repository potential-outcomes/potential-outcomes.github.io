import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "",
  images: {
    unoptimized: true, // This is important when using basePath
    // Add this if you want to disable the warning about unoptimized images
    disableStaticImages: true,
  },
  // output: "export",
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
