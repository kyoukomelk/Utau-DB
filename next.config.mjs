/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'coverartarchive.org',
      },
      {
        protocol: 'https',
        hostname: 'coverartarchive.org',
      }
    ],
  },
};

export default nextConfig;
