/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/potential-outcomes",
  output: "export",
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
