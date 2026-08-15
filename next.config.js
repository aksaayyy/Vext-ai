/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'vext.so' },
      { hostname: '*.googleusercontent.com' },
      { hostname: '*.Instagrams.com' },
      { hostname: 'pbs.twimg.com' },
      { hostname: 'i.ytimg.com' },
    ],
  },
  transpilePackages: ['jszip'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
