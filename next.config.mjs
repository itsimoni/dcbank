/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,    // Disable Turbopack
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
