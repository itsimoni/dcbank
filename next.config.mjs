/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    useWasmBinary: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
